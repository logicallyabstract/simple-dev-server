import { Context, Middleware } from 'koa';
import { koaCjsToEsm } from './koa-cjs-esm';
import { transpile } from './transpile';

jest.mock('./transpile');

describe('koa cjs to esm', () => {
  let middleware: Middleware;
  let nextMock: jest.Mock;
  let isMock: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    middleware = koaCjsToEsm();
    nextMock = jest.fn();
    isMock = jest.fn();
  });

  it('should do nothing if the response is not javascript', async () => {
    isMock = jest.fn(() => false);

    const fakeContext = {
      response: {
        is: isMock,
      },
      path: '/fake/test.html',
      body: '',
    };

    await middleware((fakeContext as unknown) as Context, nextMock);

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(isMock).toHaveBeenCalledTimes(1);
    expect(fakeContext.body).toBe('');
    expect(transpile).not.toHaveBeenCalled();
  });

  it('should do nothing if the returned JS is excluded', async () => {
    middleware = koaCjsToEsm([/fake/]);
    isMock = jest.fn(() => true);

    const fakeContext = {
      response: {
        is: isMock,
      },
      path: '/fake/test.js',
      body: '',
    };

    await middleware((fakeContext as unknown) as Context, nextMock);

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(isMock).toHaveBeenCalledTimes(1);
    expect(fakeContext.body).toBe('');
    expect(transpile).not.toHaveBeenCalled();
  });

  it('should transpile a JS file', async () => {
    isMock = jest.fn(() => true);

    const fakeContext = {
      response: {
        is: isMock,
      },
      path: '/fake/test.js',
      body: 'testing',
      status: 404,
      type: '',
    };

    (transpile as jest.Mock).mockReturnValue('transpiled');

    await middleware((fakeContext as unknown) as Context, nextMock);

    expect(transpile).toHaveBeenCalledTimes(1);
    expect(fakeContext.body).toBe('transpiled');
    expect(fakeContext.status).toBe(200);
    expect(fakeContext.type).toBe('application/javascript');
  });

  it('should not transpile an empty JS file', async () => {
    isMock = jest.fn(() => true);

    const fakeContext = {
      response: {
        is: isMock,
      },
      path: '/fake/test.js',
      body: '',
      status: 404,
      type: '',
    };

    (transpile as jest.Mock).mockReturnValue('transpiled');

    await middleware((fakeContext as unknown) as Context, nextMock);

    expect(transpile).not.toHaveBeenCalled();
    expect(fakeContext.body).toBe('');
    expect(fakeContext.status).toBe(404);
    expect(fakeContext.type).toBe('');
  });

  it('should catch a transpile error', async () => {
    isMock = jest.fn(() => true);
    const consoleErrorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const fakeContext = {
      response: {
        is: isMock,
      },
      path: '/fake/test.js',
      body: 'testing',
      status: 404,
      type: '',
    };

    (transpile as jest.Mock).mockImplementation(() => {
      throw new Error('transpile error');
    });

    await middleware((fakeContext as unknown) as Context, nextMock);

    expect(fakeContext.status).toBe(500);
    expect(transpile).toHaveBeenCalledTimes(1);
    expect(fakeContext.type).toBe('text/plain');
    expect(fakeContext.body).toBeNull();
    expect(consoleErrorMock).toHaveBeenCalledTimes(1);
  });
});
