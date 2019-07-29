"use strict";

const mock = require("egg-mock");
const assert = require("assert");
const _ = require("lodash");

describe("test/kafkajs.test.js", () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: "apps/kafkajs-test",
    });
    // mock.consoleLevel("INFO");
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it("should pub sub works fine", cb => {
    cb = _.once(cb);
    const topic = "topic102";
    const key = Math.random() + "";
    const subscriber = app.kafka.subscriberMap.get(topic);
    mock(subscriber.prototype, "subscribe", async message => {
      assert(message.topic === topic);
      assert(message.key === key);
      cb();
    });
    const messages = [
      app.kafka.Message({
        topic,
        key,
        messages: [
          JSON.stringify({
            title: "test",
            content: "just a panic",
          }),
        ],
      }),
    ];
    app.kafka.send(messages).then();
  });

  it("should send message with specify partition", cb => {
    cb = _.once(cb);
    const topic = "topic102";
    const key = Math.random() + "";
    const subscriber = app.kafka.subscriberMap.get(topic);
    mock(subscriber.prototype, "subscribe", async message => {
      assert(message.topic === topic);
      assert(message.key === key);
      assert(message.partition === 3);
      cb();
    });
    const messages = [
      app.kafka.Message({
        topic,
        key,
        partition: 3,
        messages: [
          JSON.stringify({
            title: "test",
            content: "just a panic",
          }),
        ],
      }),
    ];
    app.kafka.send(messages).then();
  });
});
