import { decorateIcons } from '../../scripts/lib-franklin.js';

export default function decorate(doc) {
  doc.querySelector('ul').querySelectorAll('a').forEach((a) => {
    a.innerHTML = '';
    const social = (new URL(a)).hostname.replace('www.', '').replace('.com', ''); // get social domain name
    a.insertAdjacentHTML('beforeend', `<span class="icon icon-${social}"></span>`);
    decorateIcons(a);
  });
}
