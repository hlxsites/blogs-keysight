/* eslint-disable import/no-cycle */
import { sampleRUM } from './lib-franklin.js';
import { addBackOfficeMetaTags, loadLaunch } from './scripts.js';
/* eslint-enable import/no-cycle */

async function loadAnalytics() {
  await addBackOfficeMetaTags();
  loadLaunch();
}

// Core Web Vitals RUM collection
sampleRUM('cwv');
loadAnalytics();
