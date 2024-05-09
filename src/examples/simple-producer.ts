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
