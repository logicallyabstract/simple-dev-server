/* eslint-disable no-console */

import chunk from 'lodash-es/chunk';
import { v } from './main-import';

export const chunks = chunk(['a', 'b', 'c', 'd'], 2);

console.log(chunks);
console.log(v);
