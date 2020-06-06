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
