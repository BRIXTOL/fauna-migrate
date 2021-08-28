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
        sourcemap: env.is('dev', 'inline')
      }
    ],
    external: [
      'faunadb',
      'minimist',
      'chalk',
      'fs',
      'path',
      'ora',
      'console'
    ],
    plugins: env.if('dev')(
      [
        plugin.replace(
          {
            preventAssignment: true,
            delimiters: [ '<!', '!>' ],
            values: {
              version: config.package.version
            }
          }
        ),
        plugin.ts(
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
