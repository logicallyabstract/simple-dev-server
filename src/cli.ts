#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-unused-expressions */

import * as yargs from 'yargs';
import { createSimpleDevServerApp } from './server';

const run = () => {
  try {
    yargs
      .command(
        '$0',
        'Run the dev server',
        (cli) => {
          return cli
            .option('port', {
              alias: 'p',
              describe: 'The port to run the app on',
              type: 'number',
              default: 3000,
            })
            .option('fallback', {
              alias: 'f',
              describe: 'The fallback index.html file path to use',
              type: 'string',
            })
            .option('exclude', {
              alias: 'e',
              describe: '(Array) Exclude these regex from transformation',
              type: 'array',
            });
        },
        (argv) => {
          const normalizedExclude = (argv.exclude || []).map((item) =>
            String(item),
          );

          const app = createSimpleDevServerApp(
            normalizedExclude,
            argv.fallback,
          );
          app.listen(argv.port, () => {
            console.log(`Running on ${argv.port}...`); // eslint-disable-line no-console
          });
        },
      )
      .help().argv;
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
    process.exit(1);
  }
};

run();
