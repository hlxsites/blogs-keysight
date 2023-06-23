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
          'data-title': tagTitle || tagName,
          'data-name': tagName,
          'data-path': tagPath,
        }, tagTitle || tagName),
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
    const { title, name, path } = tag.dataset;
    const match = [title, name, path].find((val) => val.toLowerCase().indexOf(searchTerm) >= 0);
    if (match) {
      tag.closest('.path').classList.remove('filtered');
      const offset = title.toLowerCase().indexOf(searchTerm);
      if (offset >= 0) {
        const before = title.substring(0, offset);
        const term = title.substring(offset, offset + searchTerm.length);
        const after = title.substring(offset + searchTerm.length);
        tag.innerHTML = `${before}<span class="highlight">${term}</span>${after}`;
      }
    } else {
      tag.closest('.path').classList.add('filtered');
      tag.textContent = tag.dataset.title;
    }
  });

  // unhide hidden parents if they have visible children
  document.querySelectorAll('#results .path.filtered').forEach((filteredTag) => {
    const unfilteredChild = filteredTag.querySelector('.path:not(.filtered)');
    if (unfilteredChild) {
      filteredTag.classList.remove('filtered');
    }
  });

  // hide categories with no visible results
  document.querySelectorAll('#results .category').forEach((category) => {
    const unfilteredChild = category.querySelector('.path:not(.filtered)');
    if (unfilteredChild) {
      category.classList.remove('hidden');
    } else {
      category.classList.add('hidden');
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
  const selectedTags = document.querySelectorAll('#results .tag.selected');
  if (selectedTags.length > 0) {
    selectedTags.forEach((selectedTag) => {
      const clone = selectedTag.cloneNode(true);
      clone.classList.remove('selected');
      clone.textContent = selectedTag.dataset.title;
      clone.addEventListener('click', () => {
        toggleTag(selectedTag);
      });
      toCopyBuffer.push(selectedTag.dataset.path);
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
    const selectedTags = document.querySelectorAll('#results .tag.selected');
    selectedTags.forEach((tag) => {
      toggleTag(tag);
    });
  });

  document.querySelector('#search').addEventListener('keyup', filter);
  document.querySelector('#tag-type').addEventListener('change', initTaxonomy);
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.category .tag');
    if (target) {
      toggleTag(target);
    }
  });
}

init();
