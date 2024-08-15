import { Controller, Get, Query } from '@nestjs/common';
import { AppService, Venue } from './app.service';

export interface Query {
  limit: number;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getVenues(@Query() query: Query): Promise<Venue[]> {
    const {limit} = query; 
    return this.appService.getVenues(limit);
  }
}
