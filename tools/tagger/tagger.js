import { getAEMTagsHierarchy } from '../../blogs/scripts/taxonomy.js';
import { createElement } from '../sidekick/library/plugins/utils/utils.js';

function renderItems(items, ul, catId) {
  const tagKeys = Object.keys(items);
  tagKeys
    .filter((k) => !['tagName', 'tagTitle', 'tagPath'].includes(k))
    .map((k) => items[k])
    .forEach((item) => {
      const { tagName, tagTitle, tagPath } = item;
      const pathItem = createElement(
        'li',
        'path',
        {},
        createElement('span', ['tag', `cat-${catId % 4}`], {
          'data-title': tagTitle,
          'data-name': tagName,
          'data-path': tagPath,
        }, tagTitle),
      );
      ul.classList.remove('hidden');
      ul.append(pathItem);
      const subUl = createElement('ul', 'hidden');
      pathItem.append(subUl);
      renderItems(item, subUl, catId);
    });
}

async function getTaxonomy() {
  const tagTypeSelect = document.querySelector('#tag-type');
  const category = tagTypeSelect?.selectedOptions[0]?.value || 'keysight-blogs';
  const aemTags = await getAEMTagsHierarchy(category, 'en');

  return aemTags;
}

async function initTaxonomy() {
  const taxonomy = await getTaxonomy();
  const results = document.getElementById('results');
  results.innerHTML = '';
  Object.values(taxonomy).forEach((cat, idx) => {
    const catElem = createElement('div', 'category', {}, createElement('h2', '', {}, cat.tagTitle));
    const ul = createElement('ul');
    catElem.append(ul);
    renderItems(cat, ul, idx);
    results.append(catElem);
  });
}

function filter() {
  const searchTerm = document.getElementById('search').value.toLowerCase();
  document.querySelectorAll('#results .tag').forEach((tag) => {
    const { title } = tag.dataset;
    const offset = title.toLowerCase().indexOf(searchTerm);
    if (offset >= 0) {
      const before = title.substring(0, offset);
      const term = title.substring(offset, offset + searchTerm.length);
      const after = title.substring(offset + searchTerm.length);
      tag.innerHTML = `${before}<span class="highlight">${term}</span>${after}`;
      tag.closest('.path').classList.remove('filtered');
    } else {
      tag.closest('.path').classList.add('filtered');
    }
  });
}

function toggleTag(target) {
  target.classList.toggle('selected');
  // eslint-disable-next-line no-use-before-define
  displaySelected();
}

function displaySelected() {
  const selEl = document.getElementById('selected');
  const selTagsEl = selEl.querySelector('.selected-tags');
  const toCopyBuffer = [];

  selTagsEl.innerHTML = '';
  const selectedTags = document.querySelectorAll('#results .path.selected');
  if (selectedTags.length > 0) {
    selectedTags.forEach((path) => {
      const clone = path.cloneNode(true);
      clone.classList.remove('filtered', 'selected');
      const tag = clone.querySelector('.tag');
      tag.innerHTML = tag.dataset.title;
      clone.addEventListener('click', () => {
        toggleTag(path);
      });
      toCopyBuffer.push(tag.dataset.title);
      selTagsEl.append(clone);
    });

    selEl.classList.remove('hidden');
  } else {
    selEl.classList.add('hidden');
  }

  const copybuffer = document.getElementById('copybuffer');
  copybuffer.value = toCopyBuffer.join(', ');

  const copyButton = document.querySelector('button.copy');
  copyButton.removeAttribute('disabled');
  copyButton.textContent = 'Copy';
}

async function init() {
  await initTaxonomy();

  const selEl = document.getElementById('selected');
  const copyButton = selEl.querySelector('button.copy');
  copyButton.addEventListener('click', () => {
    const copyText = document.getElementById('copybuffer');
    navigator.clipboard.writeText(copyText.value);

    copyButton.textContent = 'Copied!';
    copyButton.disabled = true;
  });

  selEl.querySelector('button.clear').addEventListener('click', () => {
    const selectedTags = document.querySelectorAll('#results .path.selected');
    selectedTags.forEach((tag) => {
      toggleTag(tag);
    });
  });

  document.querySelector('#search').addEventListener('keyup', filter);
  document.querySelector('#tag-type').addEventListener('change', initTaxonomy);
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.category .path');
    if (target) {
      toggleTag(target);
    }
  });
}

init();
