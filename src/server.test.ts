/**
 * Copyright (c) 2020-present, Logically Abstract, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createSimpleDevServerApp } from './server';

describe('server', () => {
  it('should create a koa app', () => {
    const app = createSimpleDevServerApp();

    expect(app.listen).toBeDefined();
  });
});
