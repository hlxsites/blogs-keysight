import { getMetadata, createOptimizedPicture, decorateIcons } from '../../scripts/lib-franklin.js';
import { createElement, getPosts } from '../../scripts/scripts.js';

const socialIcons = ['facebook', 'twitter', 'linkedin', 'email'];

function buildSocial(sidebar) {
  const social = createElement('div', 'social');
  for (let i = 0; i < socialIcons.length; i += 1) {
    const classes = ['icon', `icon-${socialIcons[i]}`];
    const socialIcon = createElement('span', classes);
    social.appendChild(socialIcon);
  }
  sidebar.append(social);
}

async function buildSidebar(sidebar, author) {
  let authorImage;
  let authorName;
  let authorTitle;
  let authorUrl;
  const posts = await getPosts('post', -1, 'author');
  for (let i = 0; i < posts.length; i += 1) {
    if (author === posts[i].title) {
      authorImage = posts[i].image;
      authorName = posts[i].title;
      authorTitle = posts[i].authortitle !== '' ? posts[i].authortitle : 'Contributor';
      authorUrl = posts[i].path;
    }
  }
  const picMedia = [{ media: '(min-width: 160px)', width: '160' }];
  const pic = createOptimizedPicture(authorImage, '', false, picMedia);
  sidebar.innerHTML = `<a class="author-image" href="${authorUrl}">${pic.outerHTML}</a>
    <div class="author-details">
    <h3 class="author-name"><a href="${authorUrl}">${authorName}</a></h3>
    <h4 class="author-title">${authorTitle}</h4>
    </div>`;
  buildSocial(sidebar);
  decorateIcons(sidebar);
}

function buildPostData(contentcontainer) {
  const topic = getMetadata('topic');
  const pubdate = getMetadata('publication-date');
  const readtime = getMetadata('read-time');
  contentcontainer.insertAdjacentHTML('afterbegin', `<p class='blog-category'><a href='#'>${topic}</a></p>`);
  contentcontainer.querySelector('h1').insertAdjacentHTML('afterend', `<div class='post-stats'><span class='pubdate'>${pubdate}</span> | <span class="icon icon-clock"></span><span class='readtime'>${readtime}</span></div>`);
  decorateIcons(contentcontainer);
}

export default function decorate(doc) {
  const contentcontainer = doc.querySelector('.hero-container').nextElementSibling.firstElementChild;
  const classes = ['section', 'post-sidebar'];
  const sidebar = createElement('div', classes);

  // TODO load and decorate the block into the section

  let sidebarPreviousSection;
  let sectionFound = false;
  const sections = [...doc.querySelectorAll('.section')];
  while (!sectionFound && sections.length > 0) {
    const section = sections.pop();
    if (!sidebarPreviousSection) {
      sidebarPreviousSection = section;
    } else if (section.classList.contains('related-content-container') || section.classList.contains('post-cards-container')) {
      sidebarPreviousSection = section;
    } else {
      sectionFound = true;
    }
  }

  sidebarPreviousSection.insertAdjacentElement('beforebegin', sidebar);

  buildSidebar(sidebar, getMetadata('author'));
  buildPostData(contentcontainer);
}
