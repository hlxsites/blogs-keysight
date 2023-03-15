import {
  createElement,
} from '../../scripts/scripts.js';

export default function decorate(block) {
  block.closest('.section').id = 'blogs_related_content';
  const colWrapper = block.firstElementChild;
  colWrapper.classList.add('cols');
  const cols = [...colWrapper.children];
  cols.forEach((col) => {
    const list = createElement('ul');
    col.querySelectorAll('a').forEach((a) => {
      const li = createElement('li');
      a.classList.remove('button');
      li.append(a);
      list.append(li);
    });
    col.append(list);
  });
}
