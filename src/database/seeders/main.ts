import { NestFactory } from '@nestjs/core';
import { SeederModule } from './seeder.module';
import { PhoneSeeder } from './phone.seeder';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);

  try {
    const seeder = app.get(PhoneSeeder);
    await seeder.seed();
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await app.close();
  }
}
bootstrap();
