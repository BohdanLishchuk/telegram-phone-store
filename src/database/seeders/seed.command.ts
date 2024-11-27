import { Command, CommandRunner } from 'nest-commander';
import { PhoneSeeder } from './phone.seeder';

@Command({ name: 'seed' })
export class SeedCommand extends CommandRunner {
  constructor(private readonly phoneSeeder: PhoneSeeder) {
    super();
  }

  async run(): Promise<void> {
    await this.phoneSeeder.seed();
    process.exit(0);
  }
}
