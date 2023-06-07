import {
  getMetadata,
  createOptimizedPicture,
  decorateIcons,
  decorateBlock,
  loadBlock,
  buildBlock,
} from '../../scripts/lib-franklin.js';
import {
  createElement,
} from '../../scripts/scripts.js';
import ffetch from '../../scripts/ffetch.js';
import { validateTags } from '../../scripts/taxonomy.js';

const socialIcons = ['facebook', 'twitter', 'linkedin', 'email'];
const tags = getMetadata('article:tag').split(', ');

async function buildCta(sidebar) {
  const ctaPath = getMetadata('cta');
  if (ctaPath) {
    const relLink = new URL(ctaPath).pathname;
    const link = createElement('a');
    link.href = relLink;
    const fragmentBlock = buildBlock('fragment', [['Source', link]]);
    sidebar.append(fragmentBlock);
    decorateBlock(fragmentBlock);
    await loadBlock(fragmentBlock);
  }
}

async function buildTags(sidebar) {
  if (getMetadata('article:tag') !== '') {
    const validatedTags = await validateTags(tags);
    const tagsContainer = createElement('div', 'tags-container');
    const list = createElement('ul', 'tags-list');
    tagsContainer.append(list);
    await Promise.all(validatedTags[0].map(async (tag) => {
      const item = createElement('li');
      const link = createElement('a');
      link.innerHTML = `<span class="tag-name">#${tag}</span>`;
      link.href = `/blogs/tag-matches?tag=${encodeURIComponent(tag)}`;
      item.append(link);
      list.append(item);
    }));
    tagsContainer.id = 'blogs_related_tags';
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
    link.title = `Share to ${socialIcons[i]}`;
    link.innerHTML = `<span class="icon icon-${socialIcons[i]}"></span>`;
    link.href = getSocialLinks(socialIcons[i], url, title);
    social.appendChild(link);
  }
  social.id = 'blogs_social_sharing';
  sidebar.append(social);
}

export default async function decorate(block) {
  let authorImage;
  let authorName;
  let authorTitle;
  let authorUrl;
  const authorPage = await ffetch('/blogs/query-index.json').sheet('nav')
    .filter((page) => page.title.toLowerCase() === getMetadata('author')?.toLowerCase()).first();

  if (authorPage) {
    authorImage = authorPage.image;
    authorName = authorPage.title;
    authorTitle = (authorPage.authortitle !== '' && authorPage.authortitle !== '0') ? authorPage.authortitle : 'Contributor';
    authorUrl = authorPage.path;
  } else {
    authorImage = '/default-meta-image';
    authorName = getMetadata('author');
    authorTitle = 'Contributor';
    authorUrl = '#';
  }

  let picHtml = '<span class="icon icon-user"></span>';
  if (!authorImage.includes('/default-meta-image')) {
    const picMedia = [{ media: '(min-width: 160px)', width: '160' }];
    const pic = createOptimizedPicture(authorImage, `Author Image for ${authorName}`, false, picMedia);
    picHtml = pic.outerHTML;
  }

  block.innerHTML = `<a class="author-image" href="${authorUrl}">${picHtml}</a>
    <div class="author-details">
      <h3 class="author-name"><a href="${authorUrl}">${authorName}</a></h3>
      <h4 class="author-title">${authorTitle}</h4>
    </div>`;
  buildSocial(block);
  buildTags(block);
  const ctaContainer = createElement('div');
  block.append(ctaContainer);
  await buildCta(ctaContainer);
  decorateIcons(block);
}
