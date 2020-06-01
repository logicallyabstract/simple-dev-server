import { createSimpleDevServerApp } from './server';

describe('server', () => {
  it('should create a koa app', () => {
    const app = createSimpleDevServerApp();

    expect(app.listen).toBeDefined();
  });
});
