import { Console } from 'console';
import chalk from 'chalk';

/**
 * Console Instance - Used for stdout and stderr
 */
export const { log, error } = new Console({
  stdout: process.stdout,
  stderr: process.stderr
});

/**
 * Help Text - Shown when using the CLI
 */
export const help = chalk`
  {gray ------------------------------------------------------------------------}

  {bold.blueBright 🚢 Fauna Migration CLI Utility}

  {bold Version:}
    <!version!>

  {bold Aliases:}
    fauna-migrate {gray.italic Long version alias}

  {bold Commands:}
    fm up   <run> {gray.italic Executes full migration, skips existing} (default)
    fm down <run> {gray.italic Reverses a migration, and will remove data records}
    fm seed       {gray.italic Seeds a collection with some local referenced data}

  {bold Options:}
    m, migrations <flags> {gray.italic Run on migrations directory}
    f, functions  <flags> {gray.italic Run on functions directory}

  {bold Flags:}
    -c, --config  {gray.italic Run migrations from a config.json config file}
    -h, --help    {gray.italic Prints commands list and help information}
    -d, --dir     <path>  {gray.italic Define a custom directory for migrations}
    -i, --input   <list>  {gray.italic A comma separated list of migrations to run}

  {bold Danger Zone:}
    --force   {gray.italic Force migration, deletes collection then re-migrates}
              {yellow BEWARE! Using force will remove data from your database}

  {gray ------------------------------------------------------------------------}

  Fauna:    https://fauna.com
  Github:   https://github.com/BRIXTOL/fauna-migrate

`;
