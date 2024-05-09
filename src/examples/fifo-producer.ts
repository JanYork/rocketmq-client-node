require('module-alias/register');

import { Producer } from '@/producer';

const fifoProducer = new Producer({
  endpoints: 'localhost:8081'
});
console.log('checkout：simpleProducer init success!');

(async () => {
  fifoProducer.startup().then(async () => {
    console.log('checkout：simpleProducer startup success!');

    for (let i = 1; i <= 10; i++) {
      await fifoProducer.send({
        messageGroup: 'checkout-group',
        topic: 'checkout-topic-fifo',
        tag: 'checkout',
        keys: ['checkout-key'],
        body: Buffer.from(i.toString())
      });

      console.log('message %d sent', i);
      console.log('checkout：send message success!');
    }

    process.exit(0);
  });
})();
