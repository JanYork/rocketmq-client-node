import { Producer } from '../producer';
import { Logger } from '../logger';
import { ConsoleLogger } from '../logger/console.logger';
import LogLevel from '../enum/logger.enum';

const fifoProducer = new Producer({
  namespace: 'checkout',
  endpoints: 'localhost:8081',
  logger: new Logger(new ConsoleLogger(), LogLevel.ERROR)
});
console.log('checkout：fifoProducer init success!');

(async () => {
  fifoProducer.startup().then(async () => {
    console.log('checkout：fifoProducer startup success!');

    for (let i = 1; i <= 10; i++) {
      await fifoProducer.send({
        messageGroup: 'checkout-fifo-group',
        topic: 'checkout-fifo-topic',
        tag: 'checkout',
        keys: [Date.now().toString()],
        body: Buffer.from(i.toString())
      });

      console.log('message %d sent', i);
      console.log('checkout：send message success!');
    }

    process.exit(0);
  });
})();
