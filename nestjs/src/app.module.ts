import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VenueRepository } from './venue/venue.repository';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, VenueRepository],
})
export class AppModule {}
