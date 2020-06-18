/**
 * Copyright (c) 2020-present, Logically Abstract, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { transpile } from './transpile';

describe('transpile', () => {
  it('should transform ts to js', () => {
    const m = `
      export const b = 'testing';`;
    const result = transpile(m, '/');

    expect(result).toContain('testing');
  });

  it('should transform ts with commonjs to js', () => {
    const m = `
      const chunk = require('lodash/chunk');

      export const b = chunk(['a', 'b', 'c', 'd'], 2);`;
    const result = transpile(m, '/');

    expect(result).not.toContain('require');
    expect(result).toContain('import');
  });
});
