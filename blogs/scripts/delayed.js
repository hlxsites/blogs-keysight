/* eslint-disable import/no-cycle */
import { sampleRUM } from './lib-franklin.js';
import { loadLaunch } from './scripts.js';
/* eslint-enable import/no-cycle */

// Core Web Vitals RUM collection
sampleRUM('cwv');
loadLaunch();
