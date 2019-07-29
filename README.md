# @rokid/egg-kafkajs

[kafka-node](https://github.com/SOHU-Co/kafka-node) plugin for Egg.js.

> NOTE: This plugin just for integrate kafka-node into Egg.js, more documentation please visit https://github.com/SOHU-Co/kafka-node.

## Install

```bash
$ yarn add @rokid/egg-kafkajs
```

## Usage

```js
// {app_root}/config/plugin.js
exports.kafkajs = {
  enable: true,
  package: "@rokid/egg-kafkajs",
};
```

## Configuration

```js
// {app_root}/config/config.default.js
config.kafkajs = {
  host: "127.0.0.1:2181",
  sub: [
    {
      groupId: "consumer-groupId",
      topics: ["topic1", "topic2"],
    },
  ],
  producer: {
    requireAcks: 1,
    ackTimeoutMs: 1000,
  },
  pub: [
    {
      topic: "topic102",
      // 尝试 create topic 时使用的配置信息
      create: {
        partitions: 4,
        replicationFactor: 1,
      },
      // send message 时传入的配置信息
      send: {
        // partition: 4, // 消息发送到指定的 partition, 如不设置会自动按照消息中的 key 字段 hash 分桶
        attributes: 0,
      },
    },
  ],
};
```

## Structure

```
egg-project
├── package.json
├── app.js (optional)
├── app
|   ├── router.js
│   ├── controller
│   |   └── home.js
│   ├── service (optional)
│   |   └── user.js
│   |   └── response_time.js
│   └── kafka (optional)  --------> like `controller, service...`
│       ├── topic1_consumer.js (optional)  -------> topic name of kafka
│       └── topic2_consumer.js (optional)  -------> topic name of kafka
├── config
|   ├── plugin.js
|   ├── config.default.js
│   ├── config.prod.js
|   ├── config.test.js (optional)
|   ├── config.local.js (optional)
|   └── config.unittest.js (optional)
```

## Example

see [test/fixtures/apps/kafkajs-test/](test/fixtures/apps/kafkajs-test) for more detail.

<!-- example here -->

## License

[MIT](LICENSE)
