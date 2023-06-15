import { createElement } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = createElement('ul', 'toc-list');
  block.innerHTML = '';
  block.append(ul);

  const h2s = [...document.querySelectorAll('main h2')];
  const h3s = [...document.querySelectorAll('main h3')];

  let h3Idx = 0;
  for (let i = 0; i < h2s.length; i += 1) {
    const h2 = h2s[i];
    const li = createElement('li', 'toc-h2');
    const a = createElement('a');
    a.href = `#${h2.id}`;
    a.textContent = h2.textContent;
    li.append(a);
    ul.append(li);

    const subUl = createElement('ul', ['toc-sub-list', 'toc-list-empty']);
    li.append(subUl);
    const nextH2 = h2s[i + 1];
    for (let j = h3Idx; j < h3s.length; j += 1) {
      const h3 = h3s[j];
      // eslint-disable-next-line no-bitwise
      if (h2.compareDocumentPosition(h3) & Node.DOCUMENT_POSITION_FOLLOWING) {
        // eslint-disable-next-line no-bitwise
        if (!nextH2 || (nextH2.compareDocumentPosition(h3) & Node.DOCUMENT_POSITION_PRECEDING)) {
          const subLi = createElement('li', 'toc-h3');
          const subA = createElement('a');
          subA.href = `#${h3.id}`;
          subA.textContent = h3.textContent;
          subLi.append(subA);
          subUl.append(subLi);
          subUl.classList.remove('toc-list-empty');
        }
      }
      h3Idx += 1;
    }
  }
}
