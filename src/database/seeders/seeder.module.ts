import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Phone } from '../../phone/phone.entity';
import { PhoneSeeder } from './phone.seeder';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'autorack.proxy.rlwy.net',
      port: 29584,
      username: 'root',
      password: 'MFwMdrGnHahbsioDgeJMBUzwvINIcwGL',
      database: 'railway',
      entities: [Phone],
      synchronize: true,
      ssl: true,
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
    }),
    TypeOrmModule.forFeature([Phone]),
  ],
  providers: [PhoneSeeder],
})
export class SeederModule {}
