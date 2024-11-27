import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phone } from './phone.entity';

@Injectable()
export class PhoneService {
  constructor(
    @InjectRepository(Phone)
    private phoneRepository: Repository<Phone>,
  ) {}

  async getBrands(): Promise<string[]> {
    const phones = await this.phoneRepository.find();
    const uniqueBrands = [...new Set(phones.map((phone) => phone.brand))];
    return uniqueBrands;
  }

  async filterPhones(filters: {
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    minStorage?: number;
  }): Promise<Phone[]> {
    const query = this.phoneRepository.createQueryBuilder('phone');

    if (filters.brand) {
      query.andWhere('phone.brand = :brand', { brand: filters.brand });
    }

    if (filters.minStorage) {
      query.andWhere('phone.storage >= :minStorage', {
        minStorage: filters.minStorage,
      });
    }

    if (filters.minPrice) {
      query.andWhere('phone.price >= :minPrice', {
        minPrice: filters.minPrice,
      });
    }

    if (filters.maxPrice) {
      query.andWhere('phone.price <= :maxPrice', {
        maxPrice: filters.maxPrice,
      });
    }

    const result = await query.getMany();

    return result;
  }

  async findById(id: number): Promise<Phone> {
    return this.phoneRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Phone[]> {
    return this.phoneRepository.find();
  }
}
