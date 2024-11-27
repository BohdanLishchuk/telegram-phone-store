import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhoneService } from './phone.service';
import { PhoneController } from './phone.controller';
import { Phone } from './phone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Phone])],
  providers: [PhoneService],
  controllers: [PhoneController],
  exports: [PhoneService],
})
export class PhoneModule {}
