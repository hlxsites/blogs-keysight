let taxonomy;
const selected = [];

function initTaxonomy(tax) {
  taxonomy = tax;
}

async function getTaxonomy() {
  const resp = await fetch('/tags.plain.html');
  const markup = await resp.text();
  const div = document.createElement('div');
  div.innerHTML = markup;
  const level1 = div.querySelector('ul').querySelectorAll(':scope > li');

  const mapChildren = (li) => {
    const title = li.childNodes[0].textContent.trim();
    const childrenLis = li.querySelectorAll(':scope > ul > li');
    return {
      title,
      children: [...childrenLis].map(mapChildren),
    };
  };

  const data = [...level1].map(mapChildren);
  return data;
}

function filter() {
  const searchTerm = document.getElementById('search').value.toLowerCase();
  let html = '';

  Object.values(taxonomy).forEach((cat, idx) => {
    html += '<div class="category">';
    html += `<h2>${cat.title}</h2>`;
    const items = cat.children;
    items.forEach((tag) => {
      const { title } = tag;
      const offset = title.toLowerCase().indexOf(searchTerm);
      if (offset >= 0) {
        const before = title.substr(0, offset);
        const term = title.substr(offset, searchTerm.length);
        const after = title.substr(offset + searchTerm.length);
        html += `
          <span data-target="${title}" data-category="${cat.title}" class="path">
            <span class="tag cat-${idx}">${before}<span class="highlight">${term}</span>${after}</span>
          </span>
        `;
      }
    });
    html += '</div>';
  });
  const results = document.getElementById('results');
  results.innerHTML = html;
}

function displaySelected() {

}

function handlePaste(_event) {

}

function addTag(event) {
  const target = event.getAttribute('data-target');
  const cat = event.getAttribute('data-category');
  selected.push({
    name: target,
    category: cat,
  });
  displaySelected();
}

async function init() {
  const tax = await getTaxonomy();

  initTaxonomy(tax);
  filter();

  document.addEventListener('paste', handlePaste);
  document.querySelector('#search').addEventListener('keyup', filter);
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.category .path');
    if (target) {
      addTag(e);
    }
  });
}

init();
