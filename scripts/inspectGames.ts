// scripts/inspectGames.ts
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Gamedig = require('gamedig');

console.log(Object.keys(Gamedig.games));
