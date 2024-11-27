import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { createHash } from 'crypto';

@Injectable()
export class PaymentService {
  private readonly publicKey: string;
  private readonly privateKey: string;

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {
    this.publicKey = 'sandbox_i40297140892';
    this.privateKey = 'sandbox_QDzKV6mFeWq0zQtuvhpLGhs4SYDKdR0fsOAGnfhS';
  }

  async createPaymentLink(order: Order, description: string) {
    const params = {
      public_key: this.publicKey,
      version: '3',
      action: 'pay',
      amount: order.amount,
      currency: 'UAH',
      description: description,
      order_id: order.orderId,
      result_url: `https://7682-31-43-127-86.ngrok-free.app/payment/success`,
      server_url: `https://7682-31-43-127-86.ngrok-free.app/payment/callback`,
      language: 'uk',
    };

    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    const signature = createHash('sha1')
      .update(this.privateKey + data + this.privateKey)
      .digest('base64');

    const paymentUrl = `https://www.liqpay.ua/api/3/checkout?data=${data}&signature=${signature}`;

    return { href: paymentUrl };
  }

  async handleCallback(data: string, signature: string) {
    const calculatedSignature = createHash('sha1')
      .update(this.privateKey + data + this.privateKey)
      .digest('base64');

    if (calculatedSignature !== signature) {
      throw new Error('Invalid signature');
    }

    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString());
    const order = await this.orderRepository.findOne({
      where: { orderId: decodedData.order_id },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (decodedData.status === 'success') {
      order.status = OrderStatus.PAID;
      order.paidAt = new Date();
      order.paymentId = decodedData.payment_id;
    } else {
      order.status = OrderStatus.FAILED;
    }

    await this.orderRepository.save(order);
    return order;
  }

  async createOrder(phoneId: number, userId: number, amount: number) {
    const order = new Order();
    order.orderId = `${Date.now()}_${phoneId}_${userId}`;
    order.phoneId = phoneId;
    order.userId = userId;
    order.amount = amount;
    order.status = OrderStatus.PENDING;

    await this.orderRepository.save(order);
    return order;
  }

  async getOrder(orderId: string) {
    return this.orderRepository.findOne({ where: { orderId } });
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
