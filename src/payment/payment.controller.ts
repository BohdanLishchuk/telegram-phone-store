import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('callback')
  async handleCallback(@Body() body: { data: string; signature: string }) {
    const order = await this.paymentService.handleCallback(
      body.data,
      body.signature,
    );
    return { status: 'success', order };
  }

  @Get('success')
  async handleSuccess(@Query('order_id') orderId: string) {
    const order = await this.paymentService.getOrder(orderId);
    return { status: 'success', order };
  }
}
