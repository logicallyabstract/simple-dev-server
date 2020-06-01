import { Context } from 'koa';
import { tsTransform } from './koa-transpile';

describe('koa-transform', () => {
  it('should do nothing on a non-js file', async () => {
    const middleware = tsTransform();
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
  });

  it('should do nothing on a 404', async () => {
    const middleware = tsTransform();
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
  });

  it('should transpile a TS module not in node_modules', async () => {
    const middleware = tsTransform();
    const nextMock = jest.fn().mockResolvedValue(undefined);
    const isMock = jest.fn().mockReturnValue(true);
    const fakeContext = ({
      path: '/src/main.js',
      response: {
        is: isMock,
      },
      body: "import { a } from 'test';\nexport { a };",
    } as unknown) as Context;

    await middleware(fakeContext, nextMock);

    expect(fakeContext.status).toBe(200);
    expect(fakeContext.type).toBe('application/javascript');
  });

  it('should transpile a TS module but noop on an empty body', async () => {
    const middleware = tsTransform();
    const nextMock = jest.fn().mockResolvedValue(undefined);
    const isMock = jest.fn().mockReturnValue(true);
    const fakeContext = ({
      path: '/src/main.js',
      response: {
        is: isMock,
      },
      body: '',
    } as unknown) as Context;

    await middleware(fakeContext, nextMock);

    expect(fakeContext.path).toContain('.ts');
  });
});
