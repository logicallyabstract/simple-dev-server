/**
 * Copyright (c) 2020-present, Logically Abstract, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { promises as fsPromises } from 'fs';
import { Middleware } from 'koa';
import { extname, join } from 'path';
import { transpile } from './transpile';

const { access, readFile } = fsPromises;

/* eslint-disable consistent-return */

export const koaResolveTypescript = (): Middleware => async (ctx, next) => {
  const pathWithoutSlash = ctx.path.substr(1);

  const inModules = pathWithoutSlash.indexOf('node_modules') === 0;

  if (inModules) {
    // let other middleware handle node_modules
    return next();
  }

  // wait for koa-static
  await next();

  // if koa-static found the file, do not modify here
  if (ctx.body != null && ctx.status < 400) {
    return;
  }

  const ext = extname(ctx.path);

  // do not try to compile a non-js path
  if (ext !== '.js') {
    return;
  }

  // construct the full file path for the file system
  const localPath = join(process.cwd(), pathWithoutSlash);
  const tsLocalPath = localPath.replace('.js', '.ts');

  try {
    await access(tsLocalPath);
  } catch (error) {
    // file not found, do nothing more
    return;
  }

  try {
    const file = await readFile(tsLocalPath);
    const transpiled = transpile(file.toString(), tsLocalPath);
    ctx.body = transpiled;
    ctx.type = 'application/javascript';
    ctx.status = 200;
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error(
      'Error compiling found typescript file %s for path %s\n\n%s',
      tsLocalPath,
      ctx.path,
      error,
    );
    ctx.body = null;
    ctx.status = 500;
  }
};
