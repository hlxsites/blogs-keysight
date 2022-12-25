// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

// execute any delayed functions added by blocks
if (window.keysight.delayed) {
  window.keysight.delayed.forEach((func) => {
    func();
  });
}
