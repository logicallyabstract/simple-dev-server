/**
 * Copyright (c) 2020-present, Logically Abstract, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO: create more specific tests with more specific assertions

import { transpile } from './transpile';

describe('transpile', () => {
  it('should transform ts to js', () => {
    const m = `
      export * from './test-a';
      export const b = 'testing';`;
    const result = transpile(m, '/fixtures/test/check.js');

    expect(result).toContain('testing');
    expect(result).toContain("export * from '/fixtures/test/test-a.js';");
  });

  it('should transform ts with commonjs to js', () => {
    const m = `
      const chunk = require('lodash/chunk');

      export const b = chunk(['a', 'b', 'c', 'd'], 2);`;
    const result = transpile(m, '/');

    expect(result).not.toContain('require');
    expect(result).toContain('import');
  });

  it('should remove type only imports', () => {
    const m = `
      import unistore, { Action } from 'unistore';
      const a: Action<{}> | undefined = undefined;
      console.log(a);
      console.log(unistore)`;
    const result = transpile(m, '/');
    expect(result).not.toContain('Action');
    expect(result).toContain("'/node_modules/unistore/dist/unistore.js'");
  });

  it('should rewrite relative paths with dyanmic imports', () => {
    const m = `
      import('./test-2');
      await import('./test-a');`;
    const result = transpile(m, '/fixtures/test/check.js');
    expect(result).toContain("'/fixtures/test/test-2.js'");
    expect(result).toContain("'/fixtures/test/test-a.js'");
  });

  it('should rewrite a relative path that goes up a directory', () => {
    const m = `
      import('../test-2');`;
    const result = transpile(m, '/fixtures/test/subfolder/check.js');
    expect(result).toContain("'/fixtures/test/test-2.js'");
  });

  it('should rewrite relative module specifier', () => {
    const m = `
      import { a } from './test-a';
      console.log(a);`;
    const result = transpile(m, '/fixtures/test/check.js');
    expect(result).toContain("'/fixtures/test/test-a.js'");
  });
});
