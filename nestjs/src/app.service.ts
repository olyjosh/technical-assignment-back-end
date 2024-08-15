import { Injectable } from '@nestjs/common';
import { VenueRepository } from './venue/venue.repository';
import * as appValidator from './app.validator';

// ! Left here for ease
export interface Venue {
  id: number;
  name: string;
  country_iso2: string;
  state: string;
  city: string;
}

@Injectable()
export class AppService {
  
  constructor(private readonly venueRepository: VenueRepository) {}

  async getVenues(limit?: number): Promise<Venue[]> {
    appValidator.default.data.getVenues(limit);

    return await this.venueRepository.find(limit);
  }
}
