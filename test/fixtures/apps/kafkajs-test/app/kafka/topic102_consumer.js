'use strict';

const Subscription = require('egg').Subscription;

class Topic1Consumer extends Subscription {
  async subscribe(message) {
    // 处理消息业务逻辑
    console.log('Please consume this message', message);
  }
}
module.exports = Topic1Consumer;