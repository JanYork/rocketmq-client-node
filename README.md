# Apache RocketMQ Node.js 客户端
这是一个自封装的 Apache RocketMQ Node.js 客户端，基于 RocketMQ 5.x版本的gRPC协议实现。

- 不依赖egg.js、rocketmq-nodejs-sdk等第三方库，它是纯粹的Node.js客户端。
- 实现了分布式下顺序保障机制。
- 自定义实现了类似的PushConsumer，通过长轮询的方式来获取消息。
- 统一的日志记录器注入，方便调试。

## 注意
项目使用了`module-alias`，所以必须要在门面文件中引入`require('module-alias/register')`，并且在`tsconfig.json`中配置`baseUrl`和`paths`。

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

对于Macos or Linux，`build`操作失败，可以尝试使用`sudo npm run build`。

对于Windows，`build`操作失败，可以尝试使用“以管理员身份运行”命令行。

## 概述

在开始客户端的部分之前，所需的一些前期工作（或者参照[这里](https://rocketmq.apache.org/zh/docs/quickStart/01quickstart/)）：

1. 准备 [Node.js](https://nodejs.dev/zh-cn/download/) 环境。Node.js 16.19.0 是确保客户端运行的最小版本，Node.js >= 18.17.0 是推荐版本；
2. 部署 namesrv，broker 以及 [proxy](https://github.com/apache/rocketmq/tree/develop/proxy) 组件。

## 快速开始

我们使用 npm 作为依赖管理和发布的工具。
你可以在 npm 的[官方网站](https://npmjs.com/)了解到关于它的更多信息。
这里是一些在开发阶段你会使用到的 npm 命令：

```shell
# 自动安装工程相关的依赖
npm install
# 初始化 grpc 代码
npm run build
# 安装rocketmq nodejs 客户端
npm i rocketmq-grpc-client
```

开启 grpc-js 的调试日志：

```bash
GRPC_TRACE=compression GRPC_VERBOSITY=debug GRPC_TRACE=all npm run xxx or node xxx
```

## 示例

### 普通消息

发送消息

```ts
require('module-alias/register');

import { Producer } from '@/producer';

const simpleProducer = new Producer({
  endpoints: 'localhost:8081'
});
console.log('checkout：simpleProducer init success!');

(async () => {
  // 启动生产者
  simpleProducer.startup().then(() => {
    console.log('checkout：simpleProducer startup success!');

    // 发送消息
    simpleProducer
      .send({
        topic: 'checkout-topic',
        tag: 'checkout',
        keys: ['checkout-key'],
        body: Buffer.from('Hello, Checkout OK!')
      })
      .then(() => {
        console.log('checkout：send message success!');
        process.exit(0);
      });
  });
})();
```

消费消息

```ts
require('module-alias/register');

import { SimpleConsumer } from '@/consumer';

const consumer = new SimpleConsumer({
  consumerGroup: 'checkout-group',
  endpoints: '192.168.1.162:8081',
  subscriptions: new Map().set('checkout-topic', '*'),
  requestTimeout: 3000,
  awaitDuration: 30000 // long polling
});

console.log('checkout：consumer init success!');

const isShutdown = false;

async function startAndConsumeMessages() {
  try {
    // 启动消费者
    await consumer.startup();
    console.log('checkout：consumer startup success!');

    async function consumeMessages() {
      try {
        const messages = await consumer.receive(20);

        if (messages.length > 0) {
          console.log('got %d messages', messages.length);

          for (const message of messages) {
            console.log('body=%o', message.body.toString());
            await consumer.ack(message);
            console.log('checkout：ack message success!');
          }
        } else {
          console.log('No messages received, waiting...');
        }
      } catch (error) {
        console.error('An error occurred:', error);
      } finally {
        // // 等待一段时间后递归调用consumeMessages
        // await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('checkout：waiting for messages...');

        if (!isShutdown) {
          await consumeMessages();
        }
      }
    }

    // 开始消费消息
    await consumeMessages();
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // 如果发生错误或者接收消息出现问题，可以选择重新启动消费者
    // 在这里你可以添加相应的逻辑
  }
}

startAndConsumeMessages().catch(console.error);
```
更多的示例可以参考[这里](./src/examples)。

### 消息类型

- [x] NORMAL
- [x] FIFO
- [x] DELAY
- [x] TRANSACTION

### 消费类型

- [x] PRODUCER
- [x] SIMPLE_CONSUMER
- [ ] PULL_CONSUMER
- [x] PUSH_CONSUMER

PushConsumer并非RocketMQ官方SDK的实现方式，官方采用本地维持一个内存队列组来不断同步
拉取消息并分发给消费者，这样的实现是复杂的，只能等待官方SDK的实现。

此处的实现是基于5.x版本独有的SimpleConsumer，通过长轮询的方式来获取消息，SimpleConsumer
是RocketMQ在此版本提出用于供消费端开发者做更加自定义的消费者实现的一种方式。