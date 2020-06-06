import * as Koa from 'koa';
import { nodeResolve } from 'koa-node-resolve';
import * as koaStatic from 'koa-static';
import { historyApi } from './koa-history-fallback';
import { tsTransform } from './koa-transpile';

/**
 * Serve from process.cwd() (usually project root) in order to access
 * node_modules. Set a fallback index file path that is relative to
 * project root or process.cwd().
 */
export const createSimpleDevServerApp = (fallbackIndex?: string) => {
  const app = new Koa();

  app.use(nodeResolve());
  app.use(tsTransform());

  if (fallbackIndex) {
    app.use(historyApi(fallbackIndex));
  }

  app.use(koaStatic('.'));

  return app;
};
