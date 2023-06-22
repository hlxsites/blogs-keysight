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
  renderScaffolding,
  fetchBlockPage,
  copyBlock,
  getLibraryMetadata,
  initSplitFrame,
  renderPreview,
} from '../utils/utils.js';

function createBlockTable(block) {
  let blockName = block.classList[0];
  if (blockName !== 'library-metadata') {
    blockName = blockName
      .replace('-', ' ')
      .split(' ')
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
      .join(' ');
    const rows = [...block.children];
    const maxCols = rows.reduce((cols, row) => (
      row.children.length > cols ? row.children.length : cols), 0);
    const table = createElement('table', '', {
      border: 1,
    }, createElement('tr', '', {
      style: 'background-color:#f4cccd;',
    }, createElement('td', '', { colspan: maxCols }, blockName)));

    rows.forEach((row) => {
      const tableRow = createElement('tr');
      [...row.children].forEach((col) => {
        const td = createElement('td');
        td.innerHTML = col.innerHTML;
        tableRow.append(td);
      });
      table.append(tableRow);
    });

    return table;
  }

  return block;
}

async function buildMetadataTable(path) {
  const table = createElement('table', '', {
    border: 1,
  }, createElement('tr', '', {
    style: 'background-color:#f4cccd;',
  }, createElement('td', '', { colspan: 2 }, 'Metadata')));

  const pageResp = await fetch(path);
  if (pageResp.ok) {
    const html = await pageResp.text();
    const parser = new DOMParser();
    const page = parser.parseFromString(html, 'text/html');

    const pageDoc = page.documentElement;
    const headSection = pageDoc.querySelector('head');

    const validMetaMap = {
      template: 'Template',
      'og:title': 'Title',
      description: 'Description',
      'og:image': 'Image',
      author: 'Author',
      'article:tag': 'Tags',
      'publication-date': 'Publication Date',
      'read-time': 'Read Time',
    };

    const metadata = {};
    headSection.querySelectorAll('meta').forEach((metaEl) => {
      const name = metaEl.getAttribute('property') ?? metaEl.getAttribute('name');
      const content = metaEl.getAttribute('content');

      const metaPropName = validMetaMap[name];
      if (metaPropName) {
        const metaVal = metadata[metaPropName];
        if (metaVal) {
          metaVal.push(content);
        } else {
          metadata[metaPropName] = [content];
        }
      }
    });

    Object.keys(metadata).forEach((mdKey) => {
      const tableRow = createElement('tr', '', {}, createElement('td', '', {}, mdKey));
      const valTd = createElement('td', '', {});
      valTd.textContent = metadata[mdKey].join(', ');
      tableRow.append(valTd);
      table.append(tableRow);
    });
  }

  return table;
}

function preCopy(docBody, mdTable) {
  const doc = docBody.cloneNode(true);

  const sectionBreak = createElement('p', '', {}, '---');
  const sections = doc.querySelectorAll(':scope > div');
  sections.forEach((section, i) => {
    if (i < (sections.length - 1)) {
      section.insertAdjacentElement('beforeend', sectionBreak.cloneNode(true));
    }

    const blocks = section.querySelectorAll(':scope > div');
    blocks.forEach((block) => {
      const blockTable = createBlockTable(block);
      block.replaceWith(blockTable);
    });
  });

  // add spacer before md table
  doc.insertAdjacentHTML('beforeend', '<p>&nbsp;</p><p></p>');
  doc.append(mdTable);

  return doc;
}

async function loadTemplates(data, container, sideNav) {
  const promises = data.map(async (item) => {
    const { name, path } = item;
    const templatePromise = fetchBlockPage(path);
    try {
      const res = await templatePromise;
      if (!res) {
        throw new Error(`An error occurred fetching ${name}`);
      }
      const blockInfo = getLibraryMetadata(res.body);

      const templateNavItem = createElement('sp-sidenav-item', '', {
        label: name,
        action: true,
      }, [
        createElement('sp-icon-file-template', '', { slot: 'icon', size: 's' }),
        createElement('sp-icon-copy', '', { slot: 'action-icon' }),
      ]);

      const mdTable = await buildMetadataTable(path);
      templateNavItem.addEventListener('OnAction', () => {
        const toCopy = preCopy(res.body, mdTable);
        copyBlock(toCopy, path, container);
      }, false);
      templateNavItem.addEventListener('click', () => {
        container.dispatchEvent(new CustomEvent('LoadTemplate', {
          detail: {
            path,
            page: res.body,
            blockInfo,
            mdTable,
          },
        }));
      });
      sideNav.append(templateNavItem);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e.message);
      container.dispatchEvent(new CustomEvent('Toast', { detail: { message: e.message, variant: 'negative' } }));
    }
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
  const sideNav = createElement('sp-sidenav', '', { 'data-testid': 'templates' });

  await loadTemplates(data, container, sideNav);

  const listContainer = content.querySelector('.list-container');
  listContainer.append(sideNav);

  container.addEventListener('LoadTemplate', (e) => {
    const {
      path,
      page,
      blockInfo,
      mdTable,
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

    renderPreview(page, path, content.querySelector('.frame-view'));

    const copyButton = content.querySelector('.copy-button');
    copyButton?.addEventListener('click', () => {
      const toCopy = preCopy(page, mdTable);
      copyBlock(toCopy, path, container);
    });
  });

  // Show blocks and hide loader
  container.append(content);
  container.dispatchEvent(new CustomEvent('HideLoader'));
}

export default {
  title: 'Templates',
  searchEnabled: false,
};
