# @brixtol/fauna-migrate

A migration CLI helper utility for populating [FaunaDB](https://fauna.com/) databases and in addition provides seeding capabilities.

> GraphQL is not supported, this module is developed for FQL.

# Install

This module has a peer dependency on the [faunadb](https://www.npmjs.com/package/faunadb) JavaScript driver, please ensure you have it installed. Also, it is probably worth noting that this is an [ESM](https://nodejs.org/api/esm.html) module.

```cli
pnpm add @brixtol/fauna-migrate --save-dev
```

> Because [pnpm](https://pnpm.js.org/en/cli/install) is dope and does dope shit.

### Fauna Secret

Supply your fauna secret key in a `.faunarc` file. The `.faunarc` file must exist in the root directory of your project.

```env
FAUNA_KEY = secret
```

> If you are using the [fauna vscode extension](https://marketplace.visualstudio.com/items?itemName=fauna.fauna), you may already have this file.

# Directory Structure

The following is the assumed (default) directory structure that is resolved from a projects cwd where fauna-migrate has been installed. The below example attempts to depict what is typical in a website/blog and show how one _might_ construct something like this.

> Please note that the `functions` directory and the `config.json` config file are both optional and not required. There is no enforced pattern to how one should structure their migrations when using fauna-migrate.

```
├── db
│   ├── migrations
│   │   ├── users.js
│   │   ├── articles.js
│   │   ├── comments.js
│   │   └── pages.js
│   │
│   ├── functions
│   │   ├── get_all.js
│   │   ├── set_date.js
│   │   └── find_word.js
│   │
│   ├── seeds
│   │   ├── articles.js
│   │   └── pages.js
│   │
│   └── config.json
│
└── .faunarc
```

# CLI

The module provides a basic cli for executing the migrations. You should avoid installing fauna-migrate globally due to its peer dependency on [faunadb](https://www.npmjs.com/package/faunadb). It is better to reference the commands within your projects `package.json` scripts.

### Commands

By default, fauna-migrate will call `up` and accepts either `up`, `down`, `seed` or `help` as first argument commands, these instruct the module on what action it should preform. An optional `run` argument can be passed which informs upon a directory to run within your migrations `db` directory, this can be either `migrations` (`m` for short) or `functions` (`f` for short).

The CLI accepts a couple flags and provides some additional features:

```cli
Aliases:
  fauna-migrate  You can also call this instead in-place of fm

Commands:
  fm up   <run>  Executes full migration, skips existing (default)
  fm down <run>  Reverses a migration, and will remove data records
  fm seed        Seeds a collection with some local referenced data
  fn help        Prints command list information (same as -h and --help)
Options:
  m, migrations <flags>  Run on migrations directory
  f, functions  <flags>  Run on functions directory

Flags:
  -c, --config  Run migrations from a config.json config file
  -h, --help    Prints command list information (same as fm help)
  -d, --dir     <path>  Define a custom directory for migrations
  -i, --input   <list>  A comma separated list of migrations to run

Danger Zone:
  --force   Force migration, deletes collection then re-migrates
            BEWARE! Using force will remove data from your database.
```

> Please be cautious when using the `--force` flag, it will delete collections before re-creating them. It's dangerous and once passed there is no turning back, ie: you are fucked.

### Examples

The below command will execute a migration (creation), as mentioned the CLI will default calls to `up` so it can be omitted. We have passed a runner argument of `m` which infers that we only wish to run files located in the `migrations` directory. We have also passed a `--dir` flag and provided a value of `database`, this infers that our migrations are contained within a directory named `database` (instead of the default `db`). The command will read all files located in `database/migrations`.

```cli
fm m --dir database
```

The below command will execute a forced migration. This is a dangerous call and needs to be used with caution because it will delete all migrations before re-creating them. Fauna has a 60 second time limit enforced, the CLI will show a timer upon deletion and once the time limit has complete it will continue execution.

```cli
fm up --force
```

The below command will execute a forced migration on 2 migrations contained within the `migrations` directory that have a filename of `bar.js` and `foo.js` which we have provided following the `-i` (short for `--input`) flag which allows us to select specific files within a defined runner directory. We also passed the `--dir` flag and again, as our previous example show, it informs that our migrations are located within `src/db/migrations`.

```cli
fm up m --dir src/db -i foo,bar --force
```

### Scripts

In your projects `package.json` file, create scripts in order to run migrations via the CLI. Use a clear and concise namespace pattern for this, for example:

```json
{
  "scripts": {
    "db:up": "fm up",
    "db:down": "fm down",
    "db:functions": "fm up f",
    "db:seed": "fm seed"
  }
}
```

> Remember if you need to separate arguments in a node env, use triple dashes, eg: `---` this will help prevent fauna-migrate commands from being ran as executables.

### Config File

Migrations can be executed according to a custom configuration. This is how we here at [Brixtol](https://brixtoltextiles.com) handle our migrations. You will need to pass the `-c` or `--config` flag in order to enable this and can optionally provide a config path (file). If the config path is unspecified fauna-migrate defaults to `db/config.json`.

> Please note that in order to use a config file, you must explicitly pass the `-c` or `--config` flag otherwise the `config.json` config file will be ignored.

```ts
import { config } from "@brixtol/fauna-migrate";

export default config({
  migrations: ["filename"],
  seeds: ["filename"],
  functions: ["filename"],
});
```

### Creating Migrations

Migrations are just basic objects. Each migration requires a `Collection` reference be provided. You can also generate indexes and functions on the migration using the `Indexes[]` or `Functions[]` options. Below we are creating a `products` collection migration and in addition creating both indexes and functions for interacting with its data entries.

We will name this file `products.js` and place it in the `db/migrations` directory, relative to our cwd root. When we are defining a migration that is creating a collection, it is good practice to keep these files in one place.

> All migrations have detailed typings with JSDoc annotations to describe using the same information found within FaunaDB documentation.

<!-- prettier-ignore -->
```typescript
import { migrate } from '@brixtol/fauna-migrate'

// The q parameter is the faunadb client instance
export default migrate(
  q => ({

    /**
     * Collection Migration
     *
     * This object is passed to the FQL `CreateCollection()` method.
     */
    Collection: {
      name: 'products',
      permissions: {
        write: q.Collection('users')
      }
    },

    /**
     * Index Migrations
     *
     * Each object in the array is passed to the FQL `CreateIndex()` method.
     */
    Indexes: [
      {
        name: 'all_products',
        source: q.Collection('products'),
        permissions: {
          read: q.Collection('users')
        }
      },
      {
        name: 'products_by_channel',
        source: q.Collection('products'),
        unique: false,
        serialized: true,
        terms: [
          { field: [ 'data', 'channel', 'shopify' ] },
          { field: [ 'data', 'channel', 'åhlens' ] }
        ]
      }
    ],

    /**
     * Function Migrations
     *
     * Each object in the array is passed to the FQL `CreateFunction()` method.
     */
    Functions: [
      {
        name: 'get_product_by_channel',
        role: 'admin',
        body: q.Query(
          q.Lambda(
            'channel'
            , q.Match(
              q.Index('products_by_channel')
              , q.Var('channel')
            )
          )
        )
      }
    ]
  })
)
```

### Creating Functions

Fauna gives us the power of being able to compose functions. When working with complex datasets single file migrations like the one we created above can start to become extraneous and harder to maintain over time. Function migrations are helpful as we can provide Fauna function migrations as single file exports.

> You may prefer to never write functions together with migrations and instead keep them isolated from one another. We tend to separate our function migrations from our collection and indexes migrations. There no enforced pattern here, do as you wish and be as you are.

<!-- prettier-ignore -->
```typescript
import { migrate } from '@brixtol/fauna-migrate'

// The q parameter is the faunadb client instance
export default migrate(
  q =>([
    {
      name: 'get_product_by_channel',
      role: 'admin',
      body: q.Query(
        q.Lambda(
          'channel'
          , q.Match(
            q.Index('products_by_channel')
            , q.Var('channel')
          )
        )
      )
    }
  ])
)

```

### Creating Seeds

Seeding is provided but needs a little extra work, you can take peek into the test/db directory to get a glance, but expect changes to come.

# Known Issues

This module is in its infant stages and there may be some breaking changes until a major version release. The package is not perfect (yet), but should suffice for the vast majority of use cases. Below is some known issues and solutions of what you may encounter:

### Regions

For now, the tool will only work with Classic [Regions](https://docs.fauna.com/fauna/current/api/fql/region_groups#limitations), so ensure your database is using classic.

### Collection Sorting Order

If a migrations is referencing an unknown or yet to be generated collection, you will need to execute the migration call a second time because the CLI will execute in alphabetic order. You can use a `config.json` to infer a sorted execution order of migrations. This will be fixed in upcoming versions.

### Persisted 60sec when using `--force` on combined migrations

This is a known bug, will be fixed in upcoming releases.

### Iteratable Execution (Internal)

The module populates a fauna database in an iterable process. This is an internal aspect and something I am aware of (author here). This can be a little more elegant. When I first put this together I was coming off a heavy weekend of partying, so my mind was little cooked. In upcoming versions this logic will change and instead the faunadb driver `Do()` method will be leveraged.

# Contributing

Contributions are welcome. This project has been open sourced by us but exists as part of a private mono/multi repository. If you wish to contribute, please use [pnpm](https://pnpm.js.org/en/cli/install).

### License

Licensed under [MIT](#LICENCE)

---

We [♡](https://www.brixtoltextiles.com/discount/4D3V3L0P3RS]) open source!
