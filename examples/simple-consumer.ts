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
    await consumer.startup();
    console.log('Consumer startup successful');

    async function consumeMessages() {
      while (!isShutdown) {
        try {
          const messages = await consumer.receive(20);
          if (messages.length > 0) {
            console.log('Got %d messages', messages.length);
            for (const message of messages) {
              console.log('Body=%o', message.body.toString());
              await consumer.ack(message);
              console.log('checkout：ack message success!');
            }
          } else {
            console.log('No messages received, waiting...');
          }
        } catch (error) {
          console.error('the receive message error');
        } finally {
          console.log('checkout：waiting for messages...');
        }
      }
    }

    // 开始消费消息
    await consumeMessages();
  } catch (error) {
    console.error('An error occurred during startup');
  } finally {
    // 如果发生错误或者接收消息出现问题，可以选择重新启动消费者
    console.log('Consumer is shutting down');
  }
}

startAndConsumeMessages().catch(console.error);
