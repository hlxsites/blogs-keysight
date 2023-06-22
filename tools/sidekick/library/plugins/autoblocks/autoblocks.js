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
import { createElement, createCopy, getLibraryMetadata } from '../utils/utils.js';

export async function fetchBlock(path) {
  if (!window.autoblocks) {
    window.autoblocks = {};
  }
  if (!window.autoblocks[path]) {
    const resp = await fetch(`${path}.plain.html`);
    if (!resp.ok) return '';

    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    window.autoblocks[path] = doc;
  }

  return window.autoblocks[path];
}

function processMarkup(pageBlock, path) {
  const copy = pageBlock.cloneNode(true);
  const url = new URL(path);
  copy.querySelectorAll('img').forEach((img) => {
    const srcSplit = img.src.split('/');
    const mediaPath = srcSplit.pop();
    img.src = `${url.origin}/${mediaPath}`;
    const { width, height } = img;
    const ratio = width > 450 ? 450 / width : 1;
    img.width = width * ratio;
    img.height = height * ratio;
  });

  copy.querySelector('div.library-metadata').remove();

  return [copy.innerHTML];
}

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
    const blockPromise = fetchBlock(path);

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
}

function filterBlocks() {
  // todo
}

let splitFrameLoaded = false;
function initSplitFrame(content) {
  if (splitFrameLoaded) {
    return;
  }

  const contentContainer = content.querySelector('.content');
  contentContainer.append(createElement('sp-split-view', '', {
    vertical: '',
    resizable: '',
    'primary-size': '2600',
    'secondary-min': '200',
    'splitter-pos': '250',
  }, [
    createElement('div', 'view', {}, [
      createElement('div', 'action-bar', {}, [
        createElement('sp-action-group', '', { compact: '', selects: 'single', selected: 'desktop' }, [
          createElement('sp-action-button', '', { value: 'mobile' }, [
            createElement('sp-icon-device-phone', '', { slot: 'icon' }),
            'Mobile',
          ]),
          createElement('sp-action-button', '', { value: 'tablet' }, [
            createElement('sp-icon-device-tablet', '', { slot: 'icon' }),
            'Tablet',
          ]),
          createElement('sp-action-button', '', { value: 'desktop' }, [
            createElement('sp-icon-device-desktop', '', { slot: 'icon' }),
            'Desktop',
          ]),
        ]),
        createElement('sp-divider', '', { size: 's' }),
      ]),
      createElement('div', 'frame-view'),
    ]),
    createElement('div', 'details-container', {}, [
      createElement('div', 'action-bar', {}, [
        createElement('h3', 'block-title'),
        createElement('div', 'actions', {}, createElement('sp-button', 'copy-button', {}, 'Copy Block')),
      ]),
      createElement('sp-divider', '', { size: 's' }),
      createElement('div', 'details'),
    ]),
  ]));

  const actionGroup = content.querySelector('sp-action-group');
  actionGroup.selected = 'desktop';

  const frameView = content.querySelector('.frame-view');
  const mobileViewButton = content.querySelector('sp-action-button[value="mobile"]');
  mobileViewButton?.addEventListener('click', () => {
    frameView.style.width = '480px';
  });

  const tabletViewButton = content.querySelector('sp-action-button[value="tablet"]');
  tabletViewButton?.addEventListener('click', () => {
    frameView.style.width = '768px';
  });

  const desktopViewButton = content.querySelector('sp-action-button[value="desktop"]');
  desktopViewButton?.addEventListener('click', () => {
    frameView.style.width = '100%';
  });

  splitFrameLoaded = true;
}

/**
 * Called when a user tries to load the plugin
 * @param {HTMLElement} container The container to render the plugin in
 * @param {Object} data The data contained in the plugin sheet
 * @param {String} query If search is active, the current search query
 */
export async function decorate(container, data, _query) {
  container.dispatchEvent(new CustomEvent('ShowLoader'));
  const content = createElement('div', 'autoblock-library', {}, createElement('sp-split-view', '', {
    'primary-size': '350',
    dir: 'ltr',
    'splitter-pos': '250',
    resizable: '',
  }, [
    createElement('div', 'menu', {}, [
      createElement('div', 'search', {}, createElement('sp-search')),
      createElement('div', 'list-container'),
    ]),
    createElement('div', 'content'),
  ]));
  const sideNav = createElement('sp-sidenav', '', { variant: 'multilevel', 'data-testid': 'autoblocks' });

  await loadBlocks(data, container, sideNav);

  // Show blocks and hide loader
  const listContainer = content.querySelector('.list-container');
  listContainer.append(sideNav);

  const search = content.querySelector('sp-search');
  search.addEventListener('input', (e) => {
    filterBlocks(e.target.value);
  });

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

    // todo render preview, update url

    const copyButton = content.querySelector('.copy-button');
    copyButton?.addEventListener('click', () => {
      const blob = new Blob(processMarkup(pageBlock, path), { type: 'text/html' });
      createCopy(blob);

      // Show toast
      container.dispatchEvent(new CustomEvent('Toast', { detail: { message: 'Copied Block' } }));
    });
  });

  container.append(content);
  container.dispatchEvent(new CustomEvent('HideLoader'));
}

export default {
  title: 'Autoblocks',
  searchEnabled: false,
};
