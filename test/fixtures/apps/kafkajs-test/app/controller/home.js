"use strict";

const Controller = require("egg").Controller;

class HomeController extends Controller {
  async index() {
    const msg = [
      this.ctx.kafka.Message({
        topic: "topic1",
        key: "key1",
        messages: [
          JSON.stringify({
            title: "test",
            content: "just a panic",
          }),
        ],
      }),
    ];
    // console.log(msg);

    const result = await this.ctx.kafka.send(msg);
    this.body = result;
    this.ctx.status = 200;
  }
}

module.exports = HomeController;
