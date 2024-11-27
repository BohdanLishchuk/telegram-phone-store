import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phone } from '../../phone/phone.entity';

@Injectable()
export class PhoneSeeder {
  constructor(
    @InjectRepository(Phone)
    private phoneRepository: Repository<Phone>,
  ) {}

  async seed() {
    await this.phoneRepository.clear();

    const phones = [
      {
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        price: 999,
        description:
          'The latest iPhone with A17 Pro chip, 48MP camera, and titanium design.',
        imageUrl: 'https://imgur.com/iG5RwKE.jpg',
        storage: 256,
        ram: 8,
      },
      {
        brand: 'Samsung',
        model: 'Galaxy S24 Ultra',
        price: 1199,
        description:
          'Features a 6.8" QHD+ display, S Pen support, and advanced AI capabilities.',
        imageUrl: 'https://imgur.com/KI5oXmD.jpg',
        storage: 512,
        ram: 12,
      },
      {
        brand: 'Google',
        model: 'Pixel 8 Pro',
        price: 899,
        description:
          "Google's flagship with advanced AI features and exceptional camera.",
        imageUrl: 'https://imgur.com/bK3wFik.jpg',
        storage: 256,
        ram: 12,
      },
      {
        brand: 'Apple',
        model: 'iPhone 15',
        price: 799,
        description: 'Features A16 Bionic chip and advanced camera system.',
        imageUrl: 'https://imgur.com/CNhqAGi.jpg',
        storage: 128,
        ram: 6,
      },
    ];

    for (const phone of phones) {
      const newPhone = this.phoneRepository.create(phone);
      await this.phoneRepository.save(newPhone);
    }

    console.log('Database has been seeded successfully');
  }
}
