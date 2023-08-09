/*
 * Fragment Block
 * Include content from one Helix page in another.
 * https://www.hlx.live/developer/block-collection/fragment
 */

import {
  createElement,
  decorateMain,
} from '../../scripts/scripts.js';

import {
  loadBlocks,
} from '../../scripts/lib-franklin.js';

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  if (path && path.startsWith('/')) {
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();
      decorateMain(main, true);
      await loadBlocks(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) {
    const fragmentSections = fragment.querySelectorAll(':scope > .section');
    const blockSection = block.closest('.section');
    const blockWrapper = block.closest('.fragment-wrapper');
    const temp = createElement('div');
    fragmentSections.forEach((fragmentSection) => {
      blockSection.classList.add(...fragmentSection.classList);
      temp.append(...fragmentSection.childNodes);
    });
    blockWrapper.replaceWith(...temp.childNodes);
  }
}
