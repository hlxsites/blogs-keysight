import { decorateIcons } from '../../scripts/lib-franklin.js';

export default function decorate(doc) {
  const socialLinkList = doc.querySelector('ul');
  if (socialLinkList) {
    socialLinkList.id = 'bio-social';
    socialLinkList.querySelectorAll('a').forEach((a) => {
      a.innerHTML = '';
      const social = (new URL(a)).hostname.replace('www.', '').replace('.com', ''); // get social domain name
      a.insertAdjacentHTML('beforeend', `<span class="icon icon-${social}"></span>`);
    });
    decorateIcons(socialLinkList);
  }

  if (doc.querySelector('.author-bio')) doc.querySelector('.author-bio').id = 'author-bio';
}
