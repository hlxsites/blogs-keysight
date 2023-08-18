/* eslint-disable import/no-cycle */
import { sampleRUM } from './lib-franklin.js';
import { addBackOfficeMetaTags, loadLaunch } from './scripts.js';
/* eslint-enable import/no-cycle */

async function runDelayed() {
  // Core Web Vitals RUM collection
  sampleRUM('cwv');

  // more delayed stuff goes here
  await addBackOfficeMetaTags();
  loadLaunch();
}

runDelayed();
