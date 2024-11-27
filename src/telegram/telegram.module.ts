import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { PhoneModule } from '../phone/phone.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [PhoneModule, PaymentModule],
  providers: [TelegramService],
})
export class TelegramModule {}
