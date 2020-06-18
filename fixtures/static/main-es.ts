/**
 * Copyright (c) 2020-present, Logically Abstract, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */

import chunk from 'lodash-es/chunk';
import { v } from './main-import';

export const chunks = chunk(['a', 'b', 'c', 'd'], 2);

console.log(chunks);
console.log(v);
