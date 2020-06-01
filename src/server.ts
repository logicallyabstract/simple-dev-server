import * as Koa from 'koa';
import { nodeResolve } from 'koa-node-resolve';
import * as koaStatic from 'koa-static';
import { tsTransform } from './koa-transpile';

export const createSimpleDevServerApp = () => {
  const app = new Koa();

  app.use(nodeResolve());
  app.use(tsTransform());
  app.use(koaStatic('.'));

  return app;
};
