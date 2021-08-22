import minimist from 'minimist';
import { resolve, basename } from 'path';
import { readdirSync, existsSync, readFileSync } from 'fs';
import chalk from 'chalk';
import { up, down } from './migrate';
import { seed } from './seed';
import { IArgv, IConfig, IConfigFile, Run } from './types';

function usingConfig (file: IConfigFile, config: IConfig, argv: IArgv) {

  const filterFiles = (
    prop: 'functions' | 'migrations' | 'seeds'
  ) => (item: string) => {

    const path = resolve(
      argv.dir,
      prop,
      item.slice(-3) === '.js'
        ? item
        : item + '.js'
    );

    if (!existsSync(path)) {
      console.error(
        chalk`{red Missing ${prop.slice(0, -1)} at} '{yellow ${prop}/${basename(path)}}'`
      );
    }

    return path;
  };

  if (file?.functions?.length > 0) {
    config.functions = file.functions.map(filterFiles('functions'));
  }

  if (file?.migrations?.length > 0) {
    config.migrations = file.migrations.map(filterFiles('migrations'));
  }

  if (file?.seeds?.length > 0) {
    config.seeds = file.seeds.map(filterFiles('seeds'));
  }

  const [ call ] = argv._;

  if (call === 'up') return up(config);
  if (call === 'down') return down(config);
  if (call === 'seed') return seed(config);

}

export function command (args: string[]) {

  const cwd = process.cwd();
  const faunarc = resolve(cwd, '.faunarc');

  if (!existsSync(faunarc)) {
    return console.error(chalk`{red Missing} {cyan .faunarc} {red file}\n`);
  }

  const contents = readFileSync(faunarc).toString();
  const secret = contents.match(/\bFAUNA_KEY\s*=\s*([A-Za-z0-9_-]+)(?=\s?)/);

  if (secret === null) {
    return console.error(chalk`\n{red Missing {cyan FAUNA_KEY} in {cyan .faunarc} file}\n`);
  }

  const config: IConfig = {
    run: Run.All,
    force: false,
    secret: secret[1],
    config: false,
    migrations: [],
    functions: [],
    seeds: []
  };

  const argv: IArgv = minimist(args, {
    default: { c: false, f: false },
    boolean: [ 'c', 'f' ],
    string: [ 'd', 'r' ],
    alias: {
      dir: 'd',
      config: 'c',
      run: 'r',
      force: 'f'
    }
  });

  const [ call, run ] = argv._;

  if (!/\b(up|down|seed)\b/.test(call)) {
    return console.error(
      chalk`\n{red Invalid argument of} {cyan ${call}} {red was passed.}`,
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
    return console.error(
      chalk`{red The} {cyan ./${basename(argv.dir)}} {red directory does not exist}\n`
    );
  }

  const dirs = readdirSync(argv.dir);

  if (!dirs.length) {
    return console.error(
      chalk`{yellow No migration sub-directories detected}\n`
    );
  }

  config.force = argv.force;

  if (argv.config) {

    const configFile = resolve(argv.dir, 'config.json');

    if (!existsSync(configFile)) {
      return console.error(
        chalk`{red Missing} {cyan config.json}} {red configuration file}\n`
      );
    }

    const read = readFileSync(configFile).toString();
    const file = JSON.parse(read);

    return usingConfig(file, config, argv);

  }

  for (const dir of dirs) {
    if (/\b([mM]igrations|[fF]unctions|[Ss]eeds)\b/.test(dir)) {
      const name = dir.toLowerCase();
      const path = resolve(argv.dir, name);
      const files = readdirSync(path);
      config[name] = files.map(file => resolve(path, file));
    }
  }

  if (call === 'up' || call === 'down') {

    if (run) {

      if (!/\b(migrations|functions|f|m)\b/.test(run)) {
        return console.error(
          chalk`\n{red Invalid argument of} {cyan ${run}} {red was passed.}`,
          chalk`\n{red Accepts {white migrations (m)} {red or} {white functions (f)}}\n`
        );
      }

      if (run === 'm' || run === 'migrations') {
        if (!config.migrations.length) {
          return console.error(chalk`{red No migration/s exist}\n`);
        } else {
          config.run = Run.Migrations;
        }
      } else if (run === 'f' || run === 'functions') {
        if (!config.migrations.length) {
          return console.error(chalk`{red No functions/s exist}\n`);
        } else {
          config.run = Run.Functions;
        }
      }

    } else {
      if (argv.run && dirs.includes('functions')) {
        return console.error(
          chalk`\n{red Directory runner is missing, you need to inform upon a directory when}`,
          chalk`\n{red using the {cyan -r} or {cyan --run} flag, for example:}\n`,
          chalk`\n  {white fauna-migrate up {cyan migrations} -r file1,file2}`,
          chalk`\n  {white fauna-migrate up {cyan functions} -r file1,file2}`,
          chalk`\n  {white fauna-migrate up {cyan m} -r file1,file2}`,
          chalk`\n  {white fauna-migrate up {cyan f} -r file1,file2}\n`
        );
      }
    }
  }

  if (argv.run) {

    const runFilter = (arr: string[]) => (item: string) => arr.includes(basename(item));

    const files = argv.run.split(',').map(file => {
      if (file.slice(-3) !== '.js') return file + '.js';
      else return file;
    });

    if (call === 'seed') {
      config.seeds = config.migrations.filter(i => files.includes(i));
      if (!config.seeds.length) {
        return console.error(
          chalk`\n{red No matching seeds:}\n`,
          chalk`\n{cyan ${argv.run.split(',').join('\n')}}\n`
        );
      }
    } else {
      if (config.run === Run.Migrations || config.run === Run.All) {
        config.migrations = config.migrations.filter(runFilter(files));
        if (!config.migrations.length) {
          return console.error(
            chalk`\n{red No matching migrations:}\n`,
            chalk`\n{cyan ${argv.run.split(',').join('\n')}}\n`
          );
        }
      } else if (config.run === Run.Functions) {
        config.functions = config.functions.filter(runFilter(files));
        if (!config.functions.length) {
          return console.error(
            chalk`\n{red No matching functions:}\n`,
            chalk`\n{cyan ${argv.run.split(',').join('\n')}}\n`
          );
        }
      }
    }
  }

  if (call === 'up') return up(config);
  if (call === 'down') return down(config);
  if (call === 'seed') return seed(config);

}
