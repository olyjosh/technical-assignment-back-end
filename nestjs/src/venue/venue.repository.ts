import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import knexInstance from '../../knex/knex';
import { Venue } from '../app.service';

@Injectable()
export class VenueRepository {

  async find(limit?: number): Promise<Venue[]> {
    const query = `select * from venues${limit ? ' limit ?' : ''}`;
    const venues: Venue[] = (await knexInstance.raw(query, limit? [Number(limit)] : undefined))[0];
    return venues;
  }
}