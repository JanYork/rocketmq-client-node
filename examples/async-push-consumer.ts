import { MessageListener, PushConsumer } from '../consumer';
import { MessageView } from '../message';
import { MessageResult } from '../enum';

class MessageListenerImplOne implements MessageListener {
  onMessage(message: MessageView): Promise<MessageResult> {
    // 随机延迟1-1.5秒
    const delay = Math.floor(Math.random() * 500) + 1000;
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(
          'one body=%o',
          message.body.toString(),
          new Date().toLocaleTimeString('zh-CN', { hour12: false })
        );
        resolve(MessageResult.SUCCESS);
      }, delay);
    });
    // return Promise.resolve(MessageResult.SUCCESS);
  }

  onStart() {
    console.log('start');
  }

  onStop() {
    console.log('stop');
  }

  onError(error: Error) {
    console.error(error);
  }
}

class MessageListenerImplTwo implements MessageListener {
  onMessage(message: MessageView): Promise<MessageResult> {
    console.log('one body=%o', message.body.toString());
    return Promise.resolve(MessageResult.SUCCESS);
  }

  onStart() {
    console.log('start');
  }

  onStop() {
    console.log('stop');
  }

  onError(error: Error) {
    console.error(error);
  }
}

const consumerOne = new PushConsumer({
  namespace: 'checkout',
  listener: new MessageListenerImplOne(),
  consumerGroup: 'checkout-fifo-group',
  endpoints: '192.168.1.162:8081',
  subscriptions: new Map().set('checkout-fifo-topic', '*'),
  requestTimeout: 3000,
  awaitDuration: 30000,
  maxMessageNum: 5,
  longPollingInterval: 300,
  isFifo: true
});

const consumerTwo = new PushConsumer({
  namespace: 'checkout',
  listener: new MessageListenerImplTwo(),
  consumerGroup: 'checkout-fifo-group',
  endpoints: '192.168.1.162:8081',
  subscriptions: new Map().set('checkout-fifo-topic', '*'),
  requestTimeout: 3000,
  awaitDuration: 30000,
  maxMessageNum: 5,
  longPollingInterval: 300,
  isFifo: true
});

// 运行单一消费者
const runSingleConsumer = async () => {
  try {
    await consumerOne.startup();
  } catch (e) {
    console.error('start consumer error');
  }
};

// 运行多个消费者
const runMultipleConsumer = async () => {
  try {
    await consumerOne.startup();
    await consumerTwo.startup();
  } catch (e) {
    console.error('start consumer error');
  }
};

if (process.argv[2] === 'multi=true') {
  console.log('run multiple consumer');
  runMultipleConsumer().catch(console.error);
} else {
  console.log('run single consumer');
  runSingleConsumer().catch(console.error);
}
