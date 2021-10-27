import { rollup, config, env, plugin } from '@brixtol/rollup-config';
import typescript from 'typescript';

export default rollup(
  {
    input: 'src/index.ts',
    output: [
      {
        format: 'esm',
        file: config.output.main,
        exports: 'named',
        sourcemap: env.is('dev', 'inline'),
        inlineDynamicImports: true
      },
      {
        format: 'cjs',
        file: config.output.cjs,
        exports: 'named',
        sourcemap: env.is('dev', 'inline'),
        inlineDynamicImports: true
      }
    ],
    external: [
      'faunadb',
      'minimist',
      'chalk',
      'fs',
      'path',
      'console',
      'readable-stream'
    ],
    treeshake: 'smallest',
    plugins: env.if('dev')(
      [
        plugin.replace(
          {
            preventAssignment: true,
            values: {
              'node:readline': 'readline',
              'node:process': 'process'
            }
          }
        ),
        plugin.replace(
          {
            preventAssignment: true,
            delimiters: [ '<!', '!>' ],
            values: {
              version: config.package.version
            }
          }
        ),
        plugin.json(
          {
            compact: true,
            preferConst: true
          }
        ),
        plugin.resolve(
          {
            extensions: [ '.ts', '.js' ],
            preferBuiltins: true
          }
        ),
        plugin.ts2(
          {
            useTsconfigDeclarationDir: true,
            typescript
          }
        ),
        plugin.commonjs(
          {
            requireReturnsDefault: 'preferred',
            transformMixedEsModules: true
          }
        )
      ]
    )(
      [
        plugin.terser(
          {
            ecma: 2016,
            compress: {
              passes: 2
            }
          }
        ),
        plugin.filesize()
      ]
    )
  }
);
