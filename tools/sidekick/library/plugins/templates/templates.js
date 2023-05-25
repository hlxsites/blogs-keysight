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

const blockHeaderBGColor = '#f4cccd';

export async function fetchTemplate(path) {
  if (!window.templates) {
    window.templates = {};
  }
  if (!window.templates[path]) {
    const resp = await fetch(`${path}?view-doc-source=true`);
    if (!resp.ok) return '';

    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    window.templates[path] = doc;
  }

  return window.templates[path];
}

function createTag(tag, attributes = {}, html = undefined) {
  const el = document.createElement(tag);
  if (html) {
    if (html instanceof HTMLElement || html instanceof SVGElement) {
      el.append(html);
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      el.setAttribute(key, val);
    });
  }
  return el;
}

function decorateImages(templateSection, path) {
  const url = new URL(path);
  templateSection.querySelectorAll('img').forEach((img) => {
    const srcSplit = img.src.split('/');
    const mediaPath = srcSplit.pop();
    img.src = `${url.origin}/${mediaPath}`;
    const { width, height } = img;
    const ratio = 1;
    img.width = width * ratio;
    img.height = height * ratio;
  });

  return [templateSection.innerHTML];
}

function createTable(block, name, path) {
  decorateImages(block, path);
  const rows = [...block.children];
  const maxCols = rows.reduce((cols, row) => (
    row.children.length > cols ? row.children.length : cols), 0);
  const table = document.createElement('table');
  table.setAttribute('border', 1);
  const headerRow = document.createElement('tr');
  headerRow.append(createTag('th', { colspan: maxCols, align: 'left' }, name));
  headerRow.style.backgroundColor = blockHeaderBGColor;
  table.append(headerRow);
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    [...row.children].forEach((col) => {
      const td = document.createElement('td');
      if (row.children.length < maxCols) {
        td.setAttribute('colspan', maxCols);
      }
      td.innerHTML = col.innerHTML;
      tr.append(td);
    });
    table.append(tr);
  });
  return table.outerHTML;
}

function createMetadataTable(headSection, path) {
  decorateImages(headSection, path);
  // meta tags to include and their docx translation
  const validMetaMap = {
    template: 'Template', 'og:title': 'Title', description: 'Description', 'og:image': 'Image', author: 'Author', 'article:tag': 'Tags', 'publication-date': 'Publication Date', 'read-time': 'Read Time',
  };
  // stuff relevant template meta tags into array
  const metadataArray = [];
  headSection.querySelectorAll('meta').forEach((row) => {
    const headMetaTag = row.getAttributeNames()[0] === 'property' ? row.getAttribute('property') : row.getAttribute('name');
    const metaTagValue = validMetaMap[headMetaTag];
    if (metaTagValue !== undefined) {
      const metaObj = { attrib: metaTagValue, value: row.getAttribute('content') };
      metadataArray.push(metaObj);
    }
  });
  // resolve duplicates
  const compactedMetaArray = Array.from(new Set(metadataArray.map((set) => set.attrib)))
    .map((attrib) => ({
      attrib,
      value: metadataArray.filter((set) => set.attrib === attrib).map((attribute) => attribute.value).join(', '),
    }));

  const maxCols = 2;
  const table = document.createElement('table');
  table.setAttribute('border', 1);
  const headerRow = document.createElement('tr');
  headerRow.append(createTag('th', { colspan: maxCols, align: 'left' }, 'metadata'));
  headerRow.style.backgroundColor = blockHeaderBGColor;
  table.append(headerRow);
  compactedMetaArray.forEach((row) => {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.innerText = row.attrib;
    tr.append(tdName);
    const tdValue = document.createElement('td');
    tdValue.innerText = row.value;
    tr.append(tdValue);
    table.append(tr);
  });

  return table.outerHTML;
}

function createSection(section, path) {
  decorateImages(section, path);
  let output = '';
  [...section.children].forEach((row) => {
    if (row.nodeName === 'DIV') {
      const blockName = row.classList[0];
      output = output.concat(createTable(row, blockName, path));
    } else {
      output = output.concat(row.outerHTML);
    }
  });
  return output;
}

function processMarkup(template, path) {
  decorateImages(template, path);
  let output = '';
  // process template body
  template.body.querySelector('main').querySelectorAll(':scope > div').forEach((row, i) => {
    if (row.nodeName === 'DIV') {
      if (i > 0) output = output.concat('---');
      output = output.concat(createSection(row, path));
    } else {
      output = output.concat(row.outerHTML);
    }
  });
  // process template head to derive meta tags
  output = output.concat('<br/>');
  output = output.concat(createMetadataTable(template.head, path));

  return output;
}

/**
 * Called when a user tries to load the plugin
 * @param {HTMLElement} container The container to render the plugin in
 * @param {Object} data The data contained in the plugin sheet
 * @param {String} query If search is active, the current search query
 */
export async function decorate(container, data, _query) {
  container.dispatchEvent(new CustomEvent('ShowLoader'));
  const sideNav = createElement('sp-sidenav', '', { variant: 'multilevel', 'data-testid': 'templates' });

  const promises = data.map(async (item) => {
    const { name, path } = item;
    const templatePromise = fetchTemplate(path);

    try {
      const res = await templatePromise;
      if (!res) {
        throw new Error(`An error occurred fetching ${name}`);
      }

      const templateVariant = createElement('sp-sidenav-item', '', { label: name, preview: false });
      sideNav.append(templateVariant);

      const childNavItem = createElement('sp-sidenav-item', '', { label: name, 'data-testid': 'item' });
      childNavItem.setAttribute('data-info', name); // TBD: this is template description
      templateVariant.append(childNavItem);

      childNavItem.addEventListener('click', () => {
        const blobInput = processMarkup(res, path);
        const blob = new Blob([blobInput], { type: 'text/html' });
        createCopy(blob);

        // Show toast
        container.dispatchEvent(new CustomEvent('Toast', { detail: { message: 'Copied Template' } }));
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e.message);
      container.dispatchEvent(new CustomEvent('Toast', { detail: { message: e.message, variant: 'negative' } }));
    }

    return templatePromise;
  });

  await Promise.all(promises);

  // Show blocks and hide loader
  container.append(sideNav);
  container.dispatchEvent(new CustomEvent('HideLoader'));
}

export default {
  title: 'Templates',
  searchEnabled: false,
};
