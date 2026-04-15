import * as amqp from 'amqplib';

export class RabbitMQService {
  private channel: amqp.Channel;

  async connect() {
    const connection = await amqp.connect('amqp://localhost:5672');
    this.channel = await connection.createChannel();

    await this.channel.assertQueue('email_queue', {
      durable: true,
    });
  }

  async publish(message: any) {
    this.channel.sendToQueue(
      'email_queue',
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }
}
