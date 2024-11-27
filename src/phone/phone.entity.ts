import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Phone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column()
  price: number;

  @Column()
  description: string;

  @Column()
  imageUrl: string;

  @Column()
  storage: number;

  @Column()
  ram: number;
}
