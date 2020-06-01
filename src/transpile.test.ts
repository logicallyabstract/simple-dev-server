import { transpile } from './transpile';

describe('transpile', () => {
  it('should transform ts to js', () => {
    const m = `
      import { a } from './test';

      export const b = a;`;
    const result = transpile(m);

    expect(result).toContain('./test');
  });

  it('should transform ts with commonjs to js', () => {
    const m = `
      const { a } = require('./test');

      export const b = a;`;
    const result = transpile(m);

    expect(result).not.toContain('require');
  });
});
