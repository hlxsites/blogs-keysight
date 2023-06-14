import { createElement } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = createElement('ul', 'toc-list');
  block.innerHTML = '';
  block.append(ul);
  document.querySelectorAll('main h2').forEach((h2) => {
    const li = createElement('li', 'toc-h2');
    const a = createElement('a');
    a.href = `#${h2.id}`;
    a.textContent = h2.textContent;
    li.append(a);

    const h3s = h2.querySelectorAll('h3');
    if (h3s.length > 0) {
      const subUl = createElement('ul', 'toc-list');
      li.append(subUl);
      h3s.forEach((h3) => {
        const subLi = createElement('li', 'toc-h3');
        const subA = createElement('a');
        subA.href = `#${h3.id}`;
        subA.textContent = h2.textContent;
        subLi.append(subA);
      });
    }
  });
}
