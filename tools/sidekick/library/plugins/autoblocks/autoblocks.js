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
import {
  createElement,
  getLibraryMetadata,
  renderScaffolding,
  fetchBlockPage,
  copyBlock,
  renderPreview,
  initSplitFrame,
} from '../utils/utils.js';

/**
   * Called when the user clicks attempts to view the preview a block
   * @param {Element} container the plugin container
   * @param {string} path The path to the block
   */
function onPreview(container, path) {
  container.dispatchEvent(new CustomEvent('PreviewBlock', { detail: { path } }));
  window.open(path, '_blank');
}

async function loadBlocks(data, container, sideNav) {
  const promises = data.map(async (item) => {
    const { name, path } = item;
    const blockPromise = fetchBlockPage(path);

    try {
      const res = await blockPromise;
      if (!res) {
        throw new Error(`An error occurred fetching ${name}`);
      }

      const pageBlocks = res.body.querySelectorAll(':scope > div');
      const blockVariant = createElement('sp-sidenav-item', '', {
        label: name,
        action: true,
        disclosureArrow: true,
      }, [
        createElement('sp-icon-file-template', '', { slot: 'icon', size: 's' }),
        createElement('sp-icon-preview', '', { slot: 'action-icon' }),
      ]);
      blockVariant.addEventListener('OnAction', () => onPreview(container, path));
      sideNav.append(blockVariant);

      pageBlocks.forEach((pageBlock) => {
        const blockInfo = getLibraryMetadata(pageBlock);
        const blockName = blockInfo.name ?? name;
        const blockDescription = blockInfo.description ?? '';

        const childNavItem = createElement('sp-sidenav-item', '', {
          label: blockName,
          action: true,
        }, [
          createElement('sp-icon-file-code', '', { slot: 'icon', size: 's' }),
          createElement('sp-icon-copy', '', { slot: 'action-icon' }),
        ]);
        blockVariant.append(childNavItem);

        if (blockDescription) {
          childNavItem.setAttribute('data-info', blockDescription);
        }

        childNavItem.addEventListener('click', () => {
          container.dispatchEvent(new CustomEvent('LoadBlock', {
            detail: {
              path,
              pageBlock,
              blockInfo,
            },
          }));
        });

        childNavItem.addEventListener('OnAction', () => {
          copyBlock(pageBlock, path, container);
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
}

/**
 * Called when a user tries to load the plugin
 * @param {HTMLElement} container The container to render the plugin in
 * @param {Object} data The data contained in the plugin sheet
 * @param {String} query If search is active, the current search query
 */
export async function decorate(container, data, _query) {
  container.dispatchEvent(new CustomEvent('ShowLoader'));
  const content = renderScaffolding();
  const sideNav = createElement('sp-sidenav', '', { variant: 'multilevel', 'data-testid': 'autoblocks' });

  await loadBlocks(data, container, sideNav);

  const listContainer = content.querySelector('.list-container');
  listContainer.append(sideNav);

  container.addEventListener('LoadBlock', (e) => {
    const {
      path,
      pageBlock,
      blockInfo,
    } = e.detail;

    initSplitFrame(content);

    const blockTitle = content.querySelector('.block-title');
    blockTitle.textContent = blockInfo.name;

    const details = content.querySelector('.details');
    details.innerHTML = '';
    if (blockInfo.description) {
      const description = createElement('p', '', {}, blockInfo.description);
      details.append(description);
    }

    renderPreview(pageBlock, path, content.querySelector('.frame-view'));

    const copyButton = content.querySelector('.copy-button');
    copyButton?.addEventListener('click', () => {
      copyBlock(pageBlock, path, container);
    });
  });

  container.append(content);
  container.dispatchEvent(new CustomEvent('HideLoader'));
}

export default {
  title: 'Autoblocks',
  searchEnabled: false,
};
