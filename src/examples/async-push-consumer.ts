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

const consumer = new PushConsumer({
  listener: new MessageListenerImpl(),
  consumerGroup: 'checkout-group',
  endpoints: '192.168.1.162:8081',
  subscriptions: new Map().set('checkout-topic-fifo', '*'),
  requestTimeout: 3000,
  awaitDuration: 30000,
  maxMessageNum: 5,
  isFifo: true
});

(async () => {
  try {
    await consumer.startup();
  } catch (e) {
    console.error(e);
  }
})();
