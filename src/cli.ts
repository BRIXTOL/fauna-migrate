import minimist from 'minimist';
import { resolve, basename } from 'path';
import { readdirSync, existsSync, readFileSync } from 'fs';
import chalk from 'chalk';
import { up, down } from './migrate';
import { seed } from './seed';
import { help, log, error } from './log';
import { IArgv, IConfig, IConfigFile, Run } from './types';

function usingConfig (file: IConfigFile, config: IConfig, argv: IArgv) {

  const files = (prop: 'functions' | 'migrations' | 'seeds') => (item: string) => {

    const path = resolve(
      argv.dir,
      prop,
      item.slice(-3) === '.js' ? item : `${item}.js`
    );

    if (!existsSync(path)) {
      const base = basename(path);
      error(chalk`{red Missing ${prop.slice(0, -1)} at} '{yellow ${prop}/${base}}'`);
    }

    return path;

  };

  if (file?.functions?.length > 0) {
    config.functions = file.functions.map(files('functions'));
  }

  if (file?.migrations?.length > 0) {
    config.migrations = file.migrations.map(files('migrations'));
  }

  if (file?.seeds?.length > 0) {
    config.seeds = file.seeds.map(files('seeds'));
  }

  switch (argv.call) {
    case 'up':
      return up(config);
    case 'down':
      return down(config);
    case 'seed':
      return seed(config);
  }

}

/**
 * Reads the `.faunarc` file located in projects root.
 * Parses the file with simple regex returning secret
 * if found, else false if missing.
 */
function readFaunarc (cwd: string): false | { secret: string, domain: string } {

  const faunarc = resolve(cwd, '.faunarc');

  if (!existsSync(faunarc)) {
    error(chalk`{red Missing {cyan .faunarc} file}\n`);
    return false;
  }

  const contents = readFileSync(faunarc).toString();
  const secret = contents.match(/\bFAUNA_KEY\s*=\s*([A-Za-z0-9_-]+)(?=\s?)/);

  if (secret === null) {
    error(chalk`\n{red Missing {cyan FAUNA_KEY} in {cyan .faunarc} file}\n`);
    return false;
  }

  const region = contents.match(/\bFAUNA_REGION\s*=\s*(db\.(?:us|eu)\.fauna\.com)(?=\s?)/);

  return {
    secret: secret[1],
    domain: region === null ? 'db.fauna.com' : region[1]
  };

}

export function command (args: string[]) {

  const cwd = process.cwd();
  const faunarc = readFaunarc(cwd);

  if (!faunarc) return;

  console.log(faunarc);

  const config: IConfig = {
    ...faunarc,
    run: Run.All,
    force: false,
    config: false,
    migrations: [],
    functions: [],
    seeds: []
  };

  const argv: IArgv = minimist(args, {
    default: {
      c: false,
      force: false,
      help: false
    },
    boolean: [ 'c', 'h' ],
    string: [ 'd', 'f' ],
    alias: {
      dir: 'd',
      config: 'c',
      run: 'r',
      files: 'f',
      help: 'h'
    }
  });

  argv.call = argv._[0] || 'up';
  argv.run = argv._[1] || '';

  // Show Help
  if (argv.help || argv.call === 'help') {
    return log(help);
  }

  if (!/\b(up|down|seed)\b/.test(argv.call)) {
    return console.error(
      chalk`\n{red Invalid argument of} {cyan ${argv.call}} {red was passed.}`,
      chalk`\n{red Accepts only {white up}, {white down} {red or} {white seed}}\n`
    );
  }

  if (!argv.dir) {
    argv.dir = resolve(cwd, 'db');
    argv.d = argv.dir;
  } else {
    argv.dir = resolve(cwd, argv.dir);
    argv.d = argv.dir;
  }

  if (!existsSync(argv.dir)) {
    return error(
      chalk`{red The} {cyan ./${basename(argv.dir)}} {red directory does not exist}\n`
    );
  }

  const dirs = readdirSync(argv.dir);

  if (!dirs.length) {
    return error(chalk`{yellow No migration sub-directories detected}\n`);
  }

  config.force = argv.force;

  if (argv.config) {

    const configFile = resolve(argv.dir, 'config.json');

    if (!existsSync(configFile)) {
      return error(
        chalk`{red Missing} {cyan config.json}} {red configuration file}\n`
      );
    }

    const read = readFileSync(configFile).toString();

    try {

      const file = JSON.parse(read);

      return usingConfig(file, config, argv);

    } catch (e) {

      throw new Error(e);
    }
  }

  for (const dir of dirs) {
    if (/\b([mM]igrations|[fF]unctions|[Ss]eeds)\b/.test(dir)) {
      const name = dir.toLowerCase();
      const path = resolve(argv.dir, name);
      const files = readdirSync(path);
      config[name] = files.map(file => resolve(path, file));
    }
  }

  if (argv.call === 'up' || argv.call === 'down') {

    if (argv.run) {

      if (!/\b(|f|m|migrations|functions)\b/.test(argv.run)) {
        return error(
          chalk`\n{red Invalid argument of {cyan ${argv.run}} was passed}`,
          chalk`\n{red Accepts {white migrations (m)} or {white functions (f)}}\n`
        );
      }

      if (argv.run === 'm' || argv.run === 'migrations') {

        if (!config.migrations.length) {
          return error(chalk`{red No migration/s exist}\n`);
        }

        config.run = Run.Migrations;

      } else if (argv.run === 'f' || argv.run === 'functions') {

        if (!config.migrations.length) {
          return error(chalk`{red No functions/s exist}\n`);
        }

        config.run = Run.Functions;
      }

    } else {

      if (argv.input && dirs.includes('functions')) {

        return error(
          chalk`\n{red Directory to run is missing, you need to inform upon a directory when}`,
          chalk`\n{red using the {cyan -i} or {cyan --input} flag, for example:}\n`,
          chalk`\n  {white fauna-migrate up {cyan migrations} -i file1,file2}`,
          chalk`\n  {white fauna-migrate up {cyan functions} -i file1,file2}`,
          chalk`\n  {white fauna-migrate up {cyan m} --input file1.js}`,
          chalk`\n  {white fauna-migrate up {cyan f} -i file1,file2}\n`
        );
      }
    }
  }

  if (argv.input) {

    const files = argv.input
      .split(',')
      .map(file => (
        file.slice(-3) !== '.js' ? `${file}.js` : file
      ));

    if (argv.call === 'seed') {

      config.seeds = config.migrations.filter(i => files.includes(i));

      if (!config.seeds.length) {

        return error(
          chalk`\n{red No matching seeds:}\n`,
          chalk`\n{cyan ${argv.input.split(',').join('\n')}}\n`
        );
      }

    } else {

      const runFilter = (arr: string[]) => (i: string) => arr.includes(basename(i));

      if (config.run === Run.Migrations || config.run === Run.All) {

        config.migrations = config.migrations.filter(runFilter(files));

        if (!config.migrations.length) {

          return error(
            chalk`\n{red No matching migrations:}\n`,
            chalk`\n{cyan ${argv.input.split(',').join('\n')}}\n`
          );
        }

      } else if (config.run === Run.Functions) {

        config.functions = config.functions.filter(runFilter(files));

        if (!config.functions.length) {

          return error(
            chalk`\n{red No matching functions:}\n`,
            chalk`\n{cyan ${argv.input.split(',').join('\n')}}\n`
          );
        }

      }
    }
  }

  switch (argv.call) {
    case 'up':
      return up(config);
    case 'down':
      return down(config);
    case 'seed':
      return seed(config);
  }

}
