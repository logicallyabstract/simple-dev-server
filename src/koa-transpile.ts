import * as getStream from 'get-stream';
import { Middleware } from 'koa';
import { join } from 'path';
import { Stream } from 'stream';
import { transpile } from './transpile';

/**
 * https://github.com/Polymer/koa-node-resolve/blob/master/src/koa-module-specifier-transform.ts#L179
 */

const isStream = (value: Buffer | Stream | string): value is Stream =>
  value !== null &&
  typeof value === 'object' &&
  typeof (value as { pipe: Function | undefined }).pipe === 'function';

const getBodyAsString = async (
  body: Buffer | Stream | string,
): Promise<string> => {
  if (Buffer.isBuffer(body)) {
    return body.toString();
  }
  if (isStream(body)) {
    return getStream(body);
  }
  if (typeof body !== 'string') {
    return '';
  }
  return body;
};

/**
 * /end
 * Thanks Polymer team and Google
 */

export const tsTransform = (): Middleware => async (ctx, next) => {
  const pathWithoutSlash = ctx.path.substr(1);
  const localPath = join(process.cwd(), pathWithoutSlash);

  const inModules = localPath.includes('node_modules');
  ctx.path = inModules ? ctx.path : ctx.path.replace('.js', '.ts');

  await next();

  if (
    ctx.path.includes('node_modules/chai') ||
    ctx.path.includes('node_modules/mocha')
  ) {
    return;
  }

  // setting path to 'ts' results in a guess to a video content type
  if (
    !ctx.response.is('video/mp2t') &&
    !ctx.response.is('application/javascript')
  ) {
    return;
  }

  const body = await getBodyAsString(ctx.body);

  if (!body) {
    return;
  }

  try {
    ctx.body = transpile(body);
    ctx.type = 'application/javascript';
    ctx.status = 200;
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error(error);
    ctx.type = 'text/plain; charset=utf-8';
    ctx.body = '';
    ctx.status = 500;
  }
};
