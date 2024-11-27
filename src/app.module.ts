import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhoneModule } from './phone/phone.module';
import { Phone } from './phone/phone.entity';
import { TelegramModule } from './telegram/telegram.module';
import { Order } from './payment/order.entity';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'autorack.proxy.rlwy.net',
      port: 29584,
      username: 'root',
      password: 'MFwMdrGnHahbsioDgeJMBUzwvINIcwGL',
      database: 'railway',
      entities: [Phone, Order],
      synchronize: true, // set false in production
    }),
    PhoneModule,
    PaymentModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
