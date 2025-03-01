import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

const createDbDriver = (port: number) =>
  new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: `postgresql://user:password@localhost:${port}/db`,
      }),
    }),
  });

export const dbE2e = {
  postgres_15_postgis_3: createDbDriver(15003),
};
