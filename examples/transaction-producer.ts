import { Producer, Transaction } from '../producer';

const simpleProducer = new Producer({
  endpoints: 'localhost:8081'
});
console.log('checkout：tran-producer init success!');

(async () => {
  // 启动生产者
  await simpleProducer.startup();

  console.log('checkout：tran-producer startup success!');
  const transaction = new Transaction(simpleProducer);

  // 发送消息
  await simpleProducer.send(
    {
      topic: 'checkout-topic-trans',
      tag: 'checkout',
      keys: ['checkout-key'],
      body: Buffer.from('Hello, Checkout OK!')
    },
    transaction
  );

  setTimeout(async () => {
    await transaction.commit();
    console.log('checkout：transaction commit success!');

    console.log('checkout：send message success!');
    process.exit(0);
  }, 5000);
})();
