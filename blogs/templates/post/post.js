import {
  getMetadata,
  decorateIcons,
  buildBlock,
  decorateBlock,
} from '../../scripts/lib-franklin.js';
import { createElement, getNavPages } from '../../scripts/scripts.js';

async function buildPostData(h1) {
  const pages = await getNavPages();
  const topic = getMetadata('subtopic') !== '' ? getMetadata('subtopic') : getMetadata('topic');
  let topicPath = '#';
  pages.forEach((page) => {
    if (page.topic === topic || page.subtopic === topic) {
      topicPath = page.path;
    }
  });
  const pubdate = getMetadata('publication-date');
  const readtime = getMetadata('read-time');

  h1.insertAdjacentHTML('beforebegin', `<p class='blog-category'><a href='${topicPath}'>${topic}</a></p>`);
  const stats = createElement('div', 'post-stats');
  const pubDateSpan = createElement('span', 'pubdate');
  pubDateSpan.innerHTML = pubdate;
  stats.append(pubDateSpan);
  const clockIcon = createElement('span', ['icon', 'icon-clock']);
  stats.append(clockIcon);

  if (readtime) {
    const readTimeSpan = createElement('span', 'readtime');
    readTimeSpan.innerHTML = readtime;
    stats.append(readTimeSpan);
  }

  h1.insertAdjacentElement('afterend', stats);
  decorateIcons(h1.parentElement);
}

export default async function decorate(doc) {
  const h1 = doc.querySelector('h1');
  buildPostData(h1);

  const classes = ['section'];
  const sidebarSection = createElement('div', classes, {
    'data-section-status': 'initialized',
  });
  const sidebarContainer = createElement('div');
  sidebarSection.append(sidebarContainer);

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
  const postSidebar = buildBlock('post-sidebar', '');
  sidebarContainer.append(postSidebar);
  sidebarPreviousSection.insertAdjacentElement('beforebegin', sidebarSection);
  decorateBlock(postSidebar);
}
