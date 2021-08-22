import chalk from 'chalk';
import { basename } from 'path';
import faunadb, { query as q } from 'faunadb';
import { IConfig } from './types';

const { log, error } = console;

/**
 * UP
 */
export async function seed (config: IConfig) {

  const client = new faunadb.Client({ secret: config.secret });

  if (config.seeds.length > 0) {

    for (const file of config.seeds) {

      let seeds = require(file);

      log(chalk`\n{green Seeding}: {bold.greenBright ${basename(file)}}\n`);

      if (!Array.isArray(seeds)) seeds = [ seeds ];

      const collection = basename(file, '.json');

      try {

        await client.query(
          q.Map(
            seeds
            , q.Lambda(
              [ 'data' ]
              , q.Create(
                q.Collection(collection),
                { data: q.Var('data') }
              )
            )
          )
        );

        log(chalk`  - {green seeded {greenBright.bold ${collection}} collection}`);

      } catch (e) {

        error(chalk`{redBright Failed}: ${e}`);

      }

    }

  }

  return log(chalk`\n{greenBright Seeding Completed!}\n`);
}
