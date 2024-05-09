require('module-alias/register');

import { PushConsumer } from '@/consumer';
import { MessageView } from '@/message';
import { MessageListener } from '@/consumer/listener/message.listener';
import { MessageResult } from '@/enum/message.enum';

class MessageListenerImpl implements MessageListener {
  onMessage(message: MessageView): Promise<MessageResult> {
    console.log('body=%o', message.body.toString());
    return Promise.resolve(MessageResult.SUCCESS);
  }
}

const consumer = new PushConsumer({
  listener: new MessageListenerImpl(),
  consumerGroup: 'checkout-group',
  endpoints: '192.168.1.162:8081',
  subscriptions: new Map().set('checkout-topic', '*'),
  requestTimeout: 3000,
  awaitDuration: 30000 // long polling
});

(async () => {
  try {
    await consumer.startup();
  } catch (e) {
    console.error(e);
  }
})();
