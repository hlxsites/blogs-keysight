/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { createElement, createCopy } from '../utils/utils.js';

export async function fetchBlock(path) {
  if (!window.blocks) {
    window.blocks = {};
  }
  if (!window.blocks[path]) {
    const resp = await fetch(`${path}.plain.html`);
    if (!resp.ok) return '';

    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    window.blocks[path] = doc;
  }

  return window.blocks[path];
}

function processMarkup(pageBlock, path) {
  const url = new URL(path);
  pageBlock.querySelectorAll('img').forEach((img) => {
    const srcSplit = img.src.split('/');
    const mediaPath = srcSplit.pop();
    img.src = `${url.origin}/${mediaPath}`;
    const { width, height } = img;
    const ratio = width > 200 ? 200 / width : 1;
    img.width = width * ratio;
    img.height = height * ratio;
  });

  return [pageBlock.innerHTML];
}

/**
 * Called when a user tries to load the plugin
 * @param {HTMLElement} container The container to render the plugin in
 * @param {Object} data The data contained in the plugin sheet
 * @param {String} query If search is active, the current search query
 */
export async function decorate(container, data, _query) {
  container.dispatchEvent(new CustomEvent('ShowLoader'));
  const sideNav = createElement('sp-sidenav', '', { variant: 'multilevel', 'data-testid': 'autoblocks' });

  const promises = data.map(async (item) => {
    const { name, path } = item;
    const blockPromise = fetchBlock(path);

    try {
      const res = await blockPromise;
      if (!res) {
        throw new Error(`An error occurred fetching ${name}`);
      }

      const pageBlocks = res.body.querySelectorAll(':scope > div');
      const blockVariant = createElement('sp-sidenav-item', '', { label: name, preview: false });
      sideNav.append(blockVariant);

      pageBlocks.forEach((pageBlock) => {
        let blockName = name;
        let blockDescription = '';
        const info = pageBlock.querySelector('div.block-info');
        if (info) {
          [...info.children].forEach((row) => {
            const cols = [...row.children];
            if (cols[0].textContent.toLowerCase() === 'name') {
              blockName = cols[1].textContent;
            }
            if (cols[0].textContent.toLowerCase() === 'description') {
              blockDescription = cols[1].textContent;
            }
          });
          info.remove();
        }

        const childNavItem = createElement('sp-sidenav-item', '', { label: blockName, 'data-testid': 'item' });
        blockVariant.append(childNavItem);

        if (blockDescription) {
          childNavItem.setAttribute('data-info', blockDescription);
        }

        childNavItem.addEventListener('click', () => {
          const blob = new Blob(processMarkup(pageBlock, path), { type: 'text/html' });
          createCopy(blob);

          // Show toast
          container.dispatchEvent(new CustomEvent('Toast', { detail: { message: 'Copied Block' } }));
        });
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e.message);
      container.dispatchEvent(new CustomEvent('Toast', { detail: { message: e.message, variant: 'negative' } }));
    }

    return blockPromise;
  });

  await Promise.all(promises);

  // Show blocks and hide loader
  container.append(sideNav);
  container.dispatchEvent(new CustomEvent('HideLoader'));
}

export default {
  title: 'Auto-Blocks',
  searchEnabled: false,
};
