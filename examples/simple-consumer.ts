import { SimpleConsumer } from '../consumer';

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
