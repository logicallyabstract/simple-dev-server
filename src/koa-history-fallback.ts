/**
 * Copyright (c) 2020-present, Logically Abstract, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Middleware } from 'koa';
import * as send from 'koa-send';

export const historyApi = (filename: string): Middleware => {
  return async (ctx, next) => {
    await next();

    if (ctx.body != null || ctx.status !== 404) {
      return;
    }

    if (ctx.method !== 'GET') {
      return;
    }

    // do not send fallback if the path requested has an extension
    const split = ctx.path.split('.');

    if (split.length > 1) {
      return;
    }

    try {
      await send(ctx, filename, {
        root: process.cwd(),
      });
    } catch (err) {
      if (err.status !== 404) {
        throw err;
      }
    }
  };
};
