"use strict";

const assert = require("assert");
const _ = require("lodash");
const { KeyedMessage } = require("kafka-node");

module.exports = app => {
  return function(params) {
    const { topic, messages } = params;
    assert(topic, "[egg-kafkajs] no topic specify");
    assert(
      _.isArray(messages) && !_.isEmpty(messages),
      "[egg-kafkajs] no messages specify"
    );
    let config = _(app.config)
      .get("kafkajs.pub", [])
      .find(row => row.topic === topic);
    if (!config) {
      throw new Erorr(
        `[egg-kafkajs] Topoc '${topic}' options not found in config file.`
      );
    }
    config = config.send;

    const res = _({
      topic,
      attributes: 0,
      timestamp: Date.now(),
    })
      .merge(config, params)
      .pickBy((val, key) => {
        if (_.isUndefined(val)) return false;
        return _.includes(
          ["topic", "key", "messages", "timestamp", "partition", "attributes"],
          key
        );
      })
      .value();

    // 使用 KeyedMessage
    res.messages = res.messages.map(msg => new KeyedMessage(res.key, msg));
    return res;
  };
};
