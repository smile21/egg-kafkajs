"use strict";

/**
 * egg-kafkajs default config
 * @member Config#kafkajs
 * @property {String} SOME_KEY - some description
 */
exports.keys = "_lssfsfsfs";
exports.logger = {
  level: "DEBUG",
  consoleLevel: "DEBUG",
};
exports.kafkajs = {
  host: "10.20.10.14:9092",
  sub: [{ topics: ["topic102"], groupId: "consumer-topic1" }],
  producer: {
    requireAcks: 1,
    ackTimeoutMs: 1000,
  },
  pub: [
    {
      topic: "topic102",
      create: {
        partitions: 4,
        replicationFactor: 1,
      },
      send: {
        // partition: 4,
        attributes: 0,
      },
    },
  ],
};
