function initTaxonomy(taxonomy) {
  let html = '';
  Object.values(taxonomy).forEach((cat, idx) => {
    html += '<div class="category">';
    html += `<h2>${cat.title}</h2>`;
    const items = cat.children;
    items.forEach((tag) => {
      const { title, path } = tag;
      html += `
        <span data-target="${title}" data-category="${cat.title}" class="path">${path}
          <span class="tag cat-${idx}">${title}</span>
        </span>
      `;
    });
    html += '</div>';
  });
  const results = document.getElementById('results');
  results.innerHTML = html;
}

async function getTaxonomy() {
  const resp = await fetch('/tags.plain.html');
  const markup = await resp.text();
  const div = document.createElement('div');
  div.innerHTML = markup;
  const level1 = div.querySelector('ul').querySelectorAll(':scope > li');

  const mapChildren = (li, parentPath) => {
    const title = li.childNodes[0].textContent.trim();
    const childrenLis = li.querySelectorAll(':scope > ul > li');
    const path = `${parentPath}${title}`;
    return {
      title,
      path: parentPath,
      children: [...childrenLis].map((childLi) => mapChildren(childLi, `${path}<span class="psep"> / </span>`)),
    };
  };

  const data = [...level1].map((li) => mapChildren(li, ''));
  return data;
}

function filter() {
  const searchTerm = document.getElementById('search').value.toLowerCase();
  document.querySelectorAll('#results .tag').forEach((tag) => {
    const title = tag.textContent.trim();
    const offset = title.toLowerCase().indexOf(searchTerm);
    if (offset >= 0) {
      const before = title.substr(0, offset);
      const term = title.substr(offset, searchTerm.length);
      const after = title.substr(offset + searchTerm.length);
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
  const toCopyBuffer = [];

  selEl.innerHTML = '';
  const selectedTags = document.querySelectorAll('#results .path.selected');
  if (selectedTags.length > 0) {
    selectedTags.forEach((tag) => {
      const clone = tag.cloneNode(true);
      clone.classList.remove('filtered', 'selected');
      clone.addEventListener('click', () => {
        toggleTag(tag);
      });
      toCopyBuffer.push(clone.querySelector('.tag').textContent);
      selEl.append(clone);
    });
    const button = document.createElement('button');
    button.addEventListener('click', () => {
      const copyText = document.getElementById('copybuffer');

      copyText.select();
      copyText.setSelectionRange(0, 99999);

      document.execCommand('copy');

      button.disabled = true;
    });
    button.textContent = 'Copy';
    selEl.append(button);
    selEl.classList.remove('hidden');
  } else {
    selEl.classList.add('hidden');
  }

  const copybuffer = document.getElementById('copybuffer');
  copybuffer.value = toCopyBuffer.join(', ');
}

async function init() {
  const tax = await getTaxonomy();

  initTaxonomy(tax);

  document.querySelector('#search').addEventListener('keyup', filter);
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.category .path');
    if (target) {
      toggleTag(target);
    }
  });
}

init();
