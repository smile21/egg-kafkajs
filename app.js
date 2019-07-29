"use strict";

const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const Promise = require("bluebird");
const EventEmitter = require("events");
const awaitEvent = require("await-event");
const kafkaLogging = require("kafka-node/logging");
const { Producer, ConsumerGroup } = require("kafka-node");

const Message = require("./lib/message");
const Client = require("./lib/client");

module.exports = app => {
  const logger = app.getLogger("kafkaLogger");
  kafkaLogging.setLoggerProvider(logger);

  const consumerClientMap = new Map();
  const subscriberMap = new Map();

  let appReady = false;
  app.ready(() => {
    appReady = true;
  });

  const heartEvent = new EventEmitter();
  heartEvent.await = awaitEvent;

  function errorHandler(err) {
    // 应用启动前避免错误输出到标准输出
    if (appReady) {
      app.coreLogger.error(err);
    } else {
      app.coreLogger.warn(err);
    }
  }

  for (const option of app.config.kafkajs.sub) {
    const topics = option.topics || [];
    // @see https://github.com/SOHU-Co/kafka-node#consumergroup
    let defaultOptions = {
      kafkaHost: app.config.kafkajs.host,
      groupId: option.groupId,
      sessionTimeout: 15000,
      protocol: ["roundrobin"],
      encoding: "utf8", // default is utf8, use 'buffer' for binary data
      fromOffset: "latest", // default
      commitOffsetsOnFirstJoin: true, // on the very first time this consumer group subscribes to a topic, record the offset returned in fromOffset (latest/earliest)
      outOfRangeOffset: "earliest", // default
    };
    const consumerClient = Promise.promisifyAll(
      new ConsumerGroup(_.assign(defaultOptions, option), topics)
    );
    consumerClient.on("error", errorHandler);
    consumerClient.on("connect", () => {
      heartEvent.emit(`${option.groupId}.consumerConnected`);
    });
    app.beforeStart(async function() {
      await heartEvent.await(`${option.groupId}.consumerConnected`);
      app.coreLogger.info(
        "[egg-kafkajs] consumer: %s is ready",
        option.groupId
      );
    });
    app.beforeClose(function() {
      consumerClient.close(true, function(error) {
        app.coreLogger.info(
          "[egg-kafkajs] consumer: %s is closed",
          option.groupId
        );
      });
    });

    for (let topic of topics) {
      const filepath = path.join(
        app.config.baseDir,
        `app/kafka/${topic}_consumer.js`
      );
      if (!fs.existsSync(filepath)) {
        app.coreLogger.warn(
          "[egg-kafkajs] CANNOT find the subscription logic in file:`%s` for topic=%s",
          filepath,
          topic
        );
        continue;
      } else {
        const subscriber = require(filepath);
        consumerClientMap.set(topic, consumerClient);
        subscriberMap.set(topic, subscriber);
      }
    }

    consumerClient.on("message", function(message) {
      let { topic, key } = message;
      const Subscriber = subscriberMap.get(topic);
      if (!Subscriber) {
        app.coreLogger.warn(
          "[egg-kafkajs] CANNOT find the subscriber for topic=%s",
          topic
        );
        return;
      }
      const ctx = app.createAnonymousContext();
      const subscriber = new Subscriber(ctx);
      subscriber.subscribe(message);
    });
  }

  const kafkaClient = Client({ kafkaHost: _.get(app.config, "kafkajs.host") });
  const producerDefaultOption = {
    requireAcks: 1,
    ackTimeoutMs: 1000,
    partitionerType: 3,
  };
  const producer = Promise.promisifyAll(
    new Producer(
      kafkaClient,
      _.assign(
        {},
        producerDefaultOption,
        _.get(app.config, "kafkajs.producer", {})
      )
    )
  );
  producer.on("error", errorHandler);
  producer.on("ready", async () => {
    // 按照配置信息尝试创建 topic
    let res = await producer.createTopicsAsync(
      _(app.config)
        .get("kafkajs.pub", [])
        .map(({ topic, create: { partitions, replicationFactor } }) => {
          assert(topic);
          assert(_.isNumber(partitions)); // 分区数
          assert(_.isNumber(replicationFactor)); // 副本数
          return { topic, partitions, replicationFactor };
        })
    );
    if (!_.isEmpty(res)) {
      res.forEach(r => {
        app.coreLogger.warn("[egg-kafkajs] " + _.get(r, "error", ""));
      });
    }
    heartEvent.emit("producerReady");
  });
  app.beforeStart(async function() {
    app.coreLogger.info("[egg-kafkajs] starting...");
    await heartEvent.await("producerReady");
    app.coreLogger.info("[egg-kafkajs] producer: %s is ready", "producer");
  });

  app.kafka = {
    consumerClientMap,
    subscriberMap,
    Message: Message(app),
    producer,
    async send(msg) {
      app.coreLogger.debug("[egg-kafkajs] send message", msg);
      return producer.sendAsync(msg);
    },
  };
};
