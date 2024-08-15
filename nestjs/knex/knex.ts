import { Knex, knex } from 'knex';

// Must match the credentials in the docker-compose.yml file
const config: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: 'db',
    database: 'rnv_test_db',
    user: 'rnv_user',
    password: 'rnv_pass',
  },
};

const knexInstance = knex(config);

export default knexInstance;
