#!/usr/bin/env node

import { argv } from 'yargs';
import { createSimpleDevServerApp } from './server';

const port = Number(argv.port) || 3000;

const app = createSimpleDevServerApp();

app.listen(port, () => {
  console.log(`Running on ${port}...`); // eslint-disable-line no-console
});
