import { Module } from '@nestjs/common';
import { DidModule } from '../did/did.module';
import { UsersService } from './users.service';

@Module({
  imports: [DidModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
