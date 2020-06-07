import { transpile } from './transpile';

describe('transpile', () => {
  it('should transform ts to js', () => {
    const m = `
      export const b = 'testing';`;
    const result = transpile(m);

    expect(result).toContain('testing');
  });

  it('should transform ts with commonjs to js', () => {
    const m = `
      const chunk = require('lodash/chunk');

      export const b = chunk(['a', 'b', 'c', 'd'], 2);`;
    const result = transpile(m);

    expect(result).not.toContain('require');
    expect(result).toContain('import');
  });
});
