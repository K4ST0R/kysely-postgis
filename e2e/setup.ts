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
  postgres_17_postgis_3: createDbDriver(17003),
  postgres_16_postgis_3: createDbDriver(16003),
  postgres_15_postgis_3: createDbDriver(15003),
  postgres_14_postgis_3: createDbDriver(14003),
  postgres_13_postgis_3: createDbDriver(13003),
};
