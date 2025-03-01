import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

const createConnectionString = (port: number) =>
  `postgresql://user:password@localhost:${port}/db`;

export const dbE2e = {
  postgres_15_postgis_3: new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: createConnectionString(15003),
      }),
    }),
  })
};
