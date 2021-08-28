import chalk from 'chalk';
import { basename } from 'path';
import faunadb from 'faunadb';
import { log, error } from './log';
import { IMigration, IFunction, IIndexes, ICollection, IConfig, Run } from './types';
import ora, { Ora } from 'ora';

const q = faunadb.query;

/**
 * Async Timeout
 */
function asyncTimer (spinner: Ora, ms = 61000): Promise<void> {

  let second = 60;
  const text = 'Time till re-migration is ';
  const timer = setInterval(() => {
    spinner.text = text + String(second--) + ' seconds';
  }, 1000);

  return new Promise(resolve => setTimeout(() => {
    clearInterval(timer);
    resolve();
  }, ms));

};

async function doCollection (client: faunadb.Client, collection: ICollection, force: boolean) {

  if (force !== null) log(chalk`{cyan Creating Collection}`);

  try {

    if (force) {

      try {

        await client.query(q.Delete(q.Collection(collection.name)));

      } catch (e) {

        if (e.description === `Ref refers to undefined collection '${collection.name}'`) {
          return doCollection(client, collection, null);
        }
      }

      const spinner = ora('Time till re-migration is 60 seconds').start();

      await asyncTimer(spinner);

      spinner.stop();

      return doCollection(client, collection, null);

    } else {

      await client.query(q.CreateCollection(collection));

    }

    log(chalk`  - {green created {greenBright.bold ${collection.name}} collection}`);

  } catch (e) {

    if (e.message === 'instance already exists') {

      log(chalk`  - {grey {white ${collection.name}} exists (skipping)}`);

    } else {
      error(
        chalk`{redBright Failed}: {yellowBright ${collection.name}}\n   `,
        e.description,
        '\n'
      );
    }
  }

}

async function doIndexes (client: faunadb.Client, indexes: IIndexes[]) {

  log(chalk`{cyan Creating Indexes}`);

  for (const index of indexes) {

    try {

      await client.query(q.CreateIndex(index));

      log(chalk`  - {green created {greenBright.bold ${index.name}} index}`);

    } catch (e) {

      if (e.message === 'instance already exists') {
        log(chalk`  - {grey {white ${index.name}} exists (skipping)}`);
      } else {
        error(
          chalk`{redBright Failed}: {yellowBright ${index.name}}\n   `,
          e.description,
          '\n'
        );
      }
    }
  }

}

async function doFunctions (client: faunadb.Client, functions: IFunction[], force: boolean) {

  log(chalk`{cyan Creating Functions}`);

  for (const fn of functions) {

    if (force) {

      try {

        await client.query(q.Delete(q.Function(fn.name)));

      } catch (e) {
        error(
          chalk`{redBright Failed Force}: {yellowBright ${fn.name}}\n   `,
          e.description,
          '\n'
        );
      }
    }

    try {

      await client.query(q.CreateFunction(fn));

      log(chalk`  - {green created {greenBright.bold ${fn.name}} function}`);

    } catch (e) {
      if (e.description === 'Function already exists.') {
        log(chalk`  - {grey {white ${fn.name}} exists (skipping)}`);
      } else {
        error(
          chalk`{redBright Failed}: {yellowBright ${fn.name}}\n   `,
          e.description,
          '\n'
        );
      }
    }
  }

}

/**
 * UP
 */
export async function up (config: IConfig) {

  const client = new faunadb.Client({
    secret: config.secret
  });

  if (config.force) {
    log(chalk`\n{yellowBright.bold INVOKED FORCE}\n{dim You better know what you are doing!}`);
  }

  if (config.run !== Run.Functions) {
    for (const file of config.migrations) {

      const migration: IMigration = await import(file).then(m => m.default);

      log(chalk`\n{green Migration}: {bold.greenBright ${basename(file)}}\n`);

      await doCollection(client, migration.Collection, config.force);

      if (migration?.Indexes?.length > 0) {
        await doIndexes(client, migration.Indexes);
      }

      if (migration?.Functions?.length > 0) {
        await doFunctions(client, migration.Functions, config.force);
      }

    }

  }

  if (config.run === Run.All || config.run === Run.Functions) {
    if (config.functions.length > 0) {
      for (const file of config.functions) {
        const migration: IFunction[] = await import(file).then(m => m.default);
        await doFunctions(client, migration, config.force);
      }
    }
  }

  return log(chalk`\n{greenBright Migrations Completed!}\n`);
}

export async function down (config: IConfig) {

  const client = new faunadb.Client({ secret: config.secret });

  if (config.run !== Run.Functions) {

    for (const file of config.migrations) {

      const migration: IMigration = await import(file).then(m => m.default);

      try {

        log(chalk`\n{redBright Migration}: {bold.redBright ${basename(file)}}`);

        await client.query(q.Delete(q.Collection(migration.Collection.name)));

        log(chalk`  - {grey Deleted}: {redBright ${migration.Collection.name}}`);

        for (const index of migration.Indexes) {
          log(chalk`  - {grey Deleted}: {redBright ${index.name}}`);
        }

      } catch (e) {

        error(chalk`{redBright Failed}: ${e.description}`);

      }

      if (migration?.Functions?.length > 0) {
        for (const fn of migration.Functions) {

          try {

            await client.query(q.Delete(q.Function(fn.name)));

            log(chalk`  - {grey Deleted}: {redBright ${fn.name}}`);

          } catch (e) {

            error(chalk`{redBright Failed}: ${e.description}`);

          }
        }
      }
    }

  }

  if (config.run === Run.All || config.run === Run.Functions) {

    if (config.functions.length > 0) {

      for (const file of config.functions) {

        const functions: IFunction[] = await import(file).then(m => m.default);

        log(chalk`\n{redBright Function}: {bold.redBright ${basename(file)}}`);

        for (const fn of functions) {

          try {

            await client.query(q.Delete(q.Function(fn.name)));

            log(chalk`  - {grey Deleted}: {redBright ${fn.name}}`);

          } catch (e) {

            error(chalk`{redBright Failed}: ${e.description}`);
          }
        }

      }
    }
  }

  return log(chalk`\n{greenBright Migrations Completed!}\n`);

}
