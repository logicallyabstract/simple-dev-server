import { Context, Middleware } from 'koa';
import * as send from 'koa-send';
import { historyApi } from './koa-history-fallback';

jest.mock('koa-send');

describe('fallback', () => {
  let middleware: Middleware;
  let fakeNext: () => Promise<any>;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not fallback if the path has a file extension', async () => {
    fakeNext = jest.fn().mockResolvedValue(undefined);
    middleware = historyApi('/index.html');
    const fakeContext = {
      path: '/test.js',
      method: 'GET',
      status: 404,
    } as Context;

    await middleware(fakeContext, fakeNext);

    expect(fakeContext.status).toBe(404);
    expect(fakeContext.body).toBe(undefined);
  });

  it('should not fallback if method is POST', async () => {
    fakeNext = jest.fn().mockResolvedValue(undefined);
    middleware = historyApi('/index.html');
    const fakeContext = {
      path: '/test.js',
      method: 'POST',
      status: 404,
    } as Context;

    await middleware(fakeContext, fakeNext);

    expect(fakeContext.status).toBe(404);
    expect(fakeContext.body).toBe(undefined);
  });

  it('should not fallback if body is already set', async () => {
    const fakeContext = {
      path: '/test.js',
      method: 'GET',
      status: 404,
    } as Context;

    fakeNext = jest.fn().mockImplementation(() => {
      fakeContext.body = 'test';
      fakeContext.status = 200;
    });
    middleware = historyApi('/index.html');

    await middleware(fakeContext, fakeNext);

    expect(fakeContext.status).toBe(200);
    expect(fakeContext.body).toBeDefined();
    expect(send).not.toBeCalled();
  });

  it('should fallback', async () => {
    const fakeContext = {
      path: '/test',
      status: 404,
      method: 'GET',
    } as Context;

    (send as jest.Mock).mockImplementation(() => {
      fakeContext.body = 'test';
      fakeContext.status = 200;
    });

    fakeNext = jest.fn().mockResolvedValue(undefined);
    middleware = historyApi('/index.html');

    await middleware(fakeContext, fakeNext);

    expect(fakeContext.status).toBe(200);
    expect(fakeContext.body).toBeDefined();
  });
});
