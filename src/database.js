import chalk from 'chalk'
import faunadb, { query as q } from 'faunadb'
import { config } from 'dotenv'

config()

/* CONSTANTS ---------------------------------- */

/**
 * FaunaDB Secret
 */
const secret = process.env.FAUNADB_SECRET

/**
 * Directory location of migrations
 */
const dir = './../src/db'

/**
 * Console
 */
const { log, error } = console

/* FUNCTIONS ---------------------------------- */

/**
 * UP
 *
 * @export
 * @param {{ migrations?: string[], functions?: string[]  }} params
 */
export async function up ({ migrations, functions }) {

  const client = new faunadb.Client({ secret })

  for (const migration of migrations) {

    const { collections, indexes } = require(`${dir}/migrations/${migration}`).default

    if (!collections || !indexes) {

      throw log(`Missing the ${migration} migration`)

    }

    log(chalk`{green Migrations for}: {bold.greenBright ${migration}}`)

    try {

      // await client.query(collections.length > 1 ? q.Do(...collections) : collections[0])

      // log(chalk`  - {green migrated collection}`)

      await client.query(q.Do(...indexes))

      log(chalk`  - {green created} {greenBright ${indexes.length}} {green indexes}`)

    } catch (e) {

      if (e.message === 'instance already exists') {
        log(chalk`{grey schema exists for ${migration}... skipping}`)
      } else {
        error(`There was a problem with migration ${migration}`, e)
      }

    }
  }

  log(chalk`{cyan Creating Functions}`)

  for (const name of functions) {

    const fn = require(`${dir}/functions/${name}`).default

    if (!fn) {

      throw log(`Missing the ${name} function`)

    }

    log(chalk`{green Functions for}: {bold.greenBright ${name}}`)

    try {

      await client.query(fn.length > 1 ? q.Do(...fn) : fn[0])

      log(chalk`  - {green created function}`)

    } catch (e) {

      if (e.description === 'Function already exists.') {
        log(chalk`{grey schema exists for ${name}... skipping}`)
      } else {
        error(`There was a problem with migration ${fn}`, e)
      }

    }
  }

  return log(chalk`{cyan Migration Completed!}`)

}

/**
 * DOWN
 *
 * @export
 * @param {array} migrations
 */
export async function down (migrations) {

  const client = new faunadb.Client({ secret })

  for (const migration of migrations) {

    try {

      await client.query(q.Delete(q.Collection(migration)))
      log(chalk`{red deleted} {redBright ${migration}}`)

    } catch (e) {

      log(`There was a problem deleting the ${migration} or it does not exist`, e)

    }

  }
}
