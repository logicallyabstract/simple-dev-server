/**
 * Copyright (c) 2020-present, Logically Abstract, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Context } from 'koa';
import { koaResolveTypescript } from './koa-resolve-typescript';
import { transpile } from './transpile';

jest.mock('./transpile');

describe('koa-transform', () => {
  let consoleErrorMock: jest.SpyInstance;

  afterEach(() => {
    if (consoleErrorMock) {
      jest.restoreAllMocks();
    }
    jest.resetAllMocks();
  });

  it('should do nothing on a non-js file', async () => {
    const middleware = koaResolveTypescript();
    const nextMock = jest.fn().mockResolvedValue(undefined);
    const isMock = jest.fn().mockReturnValue(false);
    const fakeContext = ({
      path: '/index.html',
      response: {
        is: isMock,
      },
    } as unknown) as Context;

    await middleware(fakeContext, nextMock);

    expect(fakeContext.path).toBe('/index.html');
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(transpile).not.toHaveBeenCalled();
  });

  it('should do nothing on a node_modules file', async () => {
    const middleware = koaResolveTypescript();
    const nextMock = jest.fn().mockResolvedValue(undefined);
    const isMock = jest.fn().mockReturnValue(false);
    const fakeContext = ({
      path: '/node_modules/test/index.js',
      response: {
        is: isMock,
      },
    } as unknown) as Context;

    await middleware(fakeContext, nextMock);

    expect(fakeContext.path).toBe('/node_modules/test/index.js');
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(transpile).not.toHaveBeenCalled();
  });

  it('should do nothing on a found file', async () => {
    const middleware = koaResolveTypescript();
    const isMock = jest.fn().mockReturnValue(false);
    const fakeContext = ({
      path: '/fixtures/static/test.js',
      response: {
        is: isMock,
      },
      body: '',
    } as unknown) as Context;
    const nextMock = jest.fn().mockImplementation(() => {
      fakeContext.body = "console.log('hello');";
      fakeContext.type = 'application/javascript';
      fakeContext.status = 200;
    });

    await middleware(fakeContext, nextMock);

    expect(fakeContext.path).toBe('/fixtures/static/test.js');
    expect(fakeContext.type).toBe('application/javascript');
    expect(fakeContext.status).toBe(200);
    expect(fakeContext.body).toBe("console.log('hello');");
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(transpile).not.toHaveBeenCalled();
  });

  it('should do nothing on a 404 for a non-js file', async () => {
    const middleware = koaResolveTypescript();
    const nextMock = jest.fn().mockResolvedValue(undefined);
    const isMock = jest.fn().mockReturnValue(false);
    const fakeContext = ({
      path: '/index.html',
      response: {
        is: isMock,
      },
      body: '',
    } as unknown) as Context;

    await middleware(fakeContext, nextMock);

    expect(fakeContext.path).toBe('/index.html');
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(transpile).not.toHaveBeenCalled();
  });

  it('should do nothing on a 404 for a ts file', async () => {
    const middleware = koaResolveTypescript();
    const isMock = jest.fn().mockReturnValue(false);
    const fakeContext = ({
      path: '/fixtures/static/test.js',
      response: {
        is: isMock,
      },
      body: '',
    } as unknown) as Context;
    const nextMock = jest.fn().mockImplementation(() => {
      fakeContext.status = 404;
    });

    await middleware(fakeContext, nextMock);

    expect(fakeContext.path).toBe('/fixtures/static/test.js');
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(transpile).not.toHaveBeenCalled();
    expect(fakeContext.status).toBe(404);
  });

  // mocking fs.promises is not possible with jest?
  it('should transpile a TS module not in node_modules', async () => {
    const middleware = koaResolveTypescript();
    const isMock = jest.fn().mockReturnValue(true);
    const fakeContext = ({
      path: '/fixtures/static/main-es.js',
      method: 'GET',
      response: {
        is: isMock,
      },
      body: '',
    } as unknown) as Context;
    const nextMock = jest.fn().mockImplementation(() => {
      fakeContext.status = 404;
    });
    (transpile as jest.Mock).mockImplementation(() => {
      return "const v = 'str';";
    });

    await middleware(fakeContext, nextMock);

    expect(fakeContext.status).toBe(200);
    expect(transpile).toHaveBeenCalledTimes(1);
    expect(fakeContext.type).toBe('application/javascript');
    expect(fakeContext.body).toBe("const v = 'str';");
  });

  // mocking fs.promises is not possible with jest?
  it('should catch a transpile error', async () => {
    const middleware = koaResolveTypescript();
    const isMock = jest.fn().mockReturnValue(true);
    consoleErrorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const fakeContext = ({
      path: '/fixtures/static/main-es.js',
      method: 'GET',
      response: {
        is: isMock,
      },
      body: '',
    } as unknown) as Context;
    const nextMock = jest.fn().mockImplementation(() => {
      fakeContext.status = 404;
    });
    (transpile as jest.Mock).mockImplementation(() => {
      throw new Error('transpile error');
    });

    await middleware(fakeContext, nextMock);

    expect(fakeContext.status).toBe(500);
    expect(transpile).toHaveBeenCalledTimes(1);
    expect(fakeContext.type).toBeUndefined();
    expect(fakeContext.body).toBeNull();
    expect(consoleErrorMock).toHaveBeenCalledTimes(1);
  });
});
