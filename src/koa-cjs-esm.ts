import * as getStream from 'get-stream';
import { Middleware } from 'koa';
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

const matchInRegexArray = (str: string, regexArray: RegExp[]): boolean => {
  for (let i = 0; i < regexArray.length; i += 1) {
    if (str.match(regexArray[i])) {
      return true;
    }
  }

  return false;
};

/**
 * Transpile a javascript file to rewrite imports, resolve node modules, and convert
 * cjs to esm.
 */
export const koaCjsToEsm = (excludePaths: RegExp[] = []): Middleware => async (
  ctx,
  next,
) => {
  // wait for koa-static
  await next();

  if (!ctx.response.is('application/javascript')) {
    return;
  }

  if (matchInRegexArray(ctx.path, excludePaths)) {
    return;
  }

  try {
    const file = await getBodyAsString(ctx.body);

    if (!file) {
      return;
    }

    const transpiled = transpile(file, ctx.path);

    ctx.body = transpiled;
    ctx.type = 'application/javascript';
    ctx.status = 200;
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Error resolving imports for path %s\n\n%s', ctx.path, error);
    ctx.body = null;
    ctx.type = 'text/plain';
    ctx.status = 500;
  }
};
