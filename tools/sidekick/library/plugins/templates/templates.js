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

export async function fetchTemplate(path) {
  if (!window.templates) {
    window.templates = {};
  }
  if (!window.templates[path]) {
    const resp = await fetch(`${path}.plain.html`);
    if (!resp.ok) return '';

    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    window.templates[path] = doc;
  }

  return window.templates[path];
}

function processMarkup(pageTemplate, path) {
  const url = new URL(path);
  pageTemplate.querySelectorAll('img').forEach((img) => {
    const srcSplit = img.src.split('/');
    const mediaPath = srcSplit.pop();
    img.src = `${url.origin}/${mediaPath}`;
    const { width, height } = img;
    const ratio = 1;
    img.width = width * ratio;
    img.height = height * ratio;
  });

  return [pageTemplate.innerHTML];
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
      childNavItem.setAttribute('data-info', name);
      templateVariant.append(childNavItem);

      childNavItem.addEventListener('click', () => {
        const blob = new Blob(processMarkup(res.body, path), { type: 'text/html' });
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

  // Show templates and hide loader
  container.append(sideNav);
  container.dispatchEvent(new CustomEvent('HideLoader'));
}

export default {
  title: 'Templates',
  searchEnabled: false,
};
