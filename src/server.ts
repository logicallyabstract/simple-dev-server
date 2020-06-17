import * as Koa from 'koa';
import * as koaStatic from 'koa-static';
import { koaCjsToEsm } from './koa-cjs-esm';
import { historyApi } from './koa-history-fallback';
import { koaResolveTypescript } from './koa-resolve-typescript';

/**
 * Serve from process.cwd() (usually project root) in order to access
 * node_modules. Set a fallback index file path that is relative to
 * project root or process.cwd() including a front '/'.
 */
export const createSimpleDevServerApp = (
  excludedPaths: string[] = [],
  fallbackIndex?: string,
) => {
  const app = new Koa();

  app.use(koaResolveTypescript());
  app.use(koaCjsToEsm(excludedPaths.map((path) => new RegExp(path))));

  if (fallbackIndex) {
    app.use(historyApi(fallbackIndex));
  }

  app.use(koaStatic('.'));

  return app;
};

export * from './koa-cjs-esm';
export * from './koa-history-fallback';
export * from './koa-resolve-typescript';
