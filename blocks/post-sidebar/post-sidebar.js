import {
  getMetadata,
  createOptimizedPicture,
  decorateIcons,
} from '../../scripts/lib-franklin.js';
import {
  createElement,
  getNavPages,
} from '../../scripts/scripts.js';

const socialIcons = ['facebook', 'twitter', 'linkedin', 'email'];
const tags = getMetadata('article:tag').split(', ');

function buildTags(sidebar) {
  if (getMetadata('article:tag') !== '') {
    const tagsContainer = createElement('div', 'tags-container');
    const list = createElement('ul', 'tags-list');
    tagsContainer.append(list);
    tags.forEach((tag) => {
      const item = createElement('li');
      const link = createElement('a');
      link.innerHTML = `<span class="tag-name">#${tag}</span>`;
      link.href = `/tag-matches?tag=${encodeURIComponent(tag)}`;
      item.append(link);
      list.append(item);
    });
    sidebar.append(tagsContainer);
  }
}

function getSocialLinks(social, url, title) {
  let link;
  switch (social) {
    case 'facebook':
      link = `http://www.facebook.com/sharer.php?u=${url}`;
      break;
    case 'twitter':
      link = `https://twitter.com/share?status=${url};text=${encodeURIComponent(title)};hashtags=${encodeURIComponent(tags.join(','))}`;
      break;
    case 'linkedin':
      link = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${encodeURIComponent(title)}&summary=${url}`;
      break;
    case 'email':
      link = `mailto:?subject=${encodeURIComponent(title)}&body=${url}`;
      break;
    default:
      link = '#';
  }
  return link;
}

function buildSocial(sidebar) {
  const social = createElement('div', 'social');
  const title = getMetadata('og:title');
  const url = window.location.href;
  for (let i = 0; i < socialIcons.length; i += 1) {
    const link = createElement('a');
    link.target = '_blank';
    link.innerHTML = `<span class="icon icon-${socialIcons[i]}"></span>`;
    link.href = getSocialLinks(socialIcons[i], url, title);
    social.appendChild(link);
  }
  sidebar.append(social);
  buildTags(sidebar);
}

export default async function decorate(block) {
  let authorImage;
  let authorName;
  let authorTitle;
  let authorUrl;
  const navPages = await getNavPages();

  const authorPage = navPages.find((page) => page.title === getMetadata('author'));
  if (authorPage) {
    authorImage = authorPage.image;
    authorName = authorPage.title;
    authorTitle = (authorPage.authortitle !== '' && authorPage.authortitle !== '0') ? authorPage.authortitle : 'Contributor';
    authorUrl = authorPage.path;
  }

  const picMedia = [{ media: '(min-width: 160px)', width: '160' }];
  const pic = createOptimizedPicture(authorImage, '', false, picMedia);
  block.innerHTML = `<a class="author-image" href="${authorUrl}">${pic.outerHTML}</a>
    <div class="author-details">
    <h3 class="author-name"><a href="${authorUrl}">${authorName}</a></h3>
    <h4 class="author-title">${authorTitle}</h4>
    </div>`;
  buildSocial(block);
  decorateIcons(block);
}
