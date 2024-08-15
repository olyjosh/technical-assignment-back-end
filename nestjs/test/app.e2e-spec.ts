import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
  });

  it('/?limit (GET)', () => {
    return request(app.getHttpServer())
      .get('/?limit=2')
      .expect(200)
      .expect([
        {
            "id": 1,
            "user_id": 1,
            "name": "Vipe",
            "country_iso2": "CZ",
            "state": null,
            "city": "Čeladná",
            "beds": 766
        },
        {
            "id": 2,
            "user_id": 2,
            "name": "Blogspan",
            "country_iso2": "FR",
            "state": "Alsace",
            "city": "Haguenau",
            "beds": 574
        }])
  });
});
