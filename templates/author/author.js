import { decorateIcons } from '../../scripts/lib-franklin.js';

export default function decorate(doc) {
  const socialLinkList = doc.querySelector('ul');
  if (socialLinkList) {
    socialLinkList.querySelectorAll('a').forEach((a) => {
      a.innerHTML = '';
      const social = (new URL(a)).hostname.replace('www.', '').replace('.com', ''); // get social domain name
      a.insertAdjacentHTML('beforeend', `<span class="icon icon-${social}"></span>`);
    });
    decorateIcons(socialLinkList);
  }
}
