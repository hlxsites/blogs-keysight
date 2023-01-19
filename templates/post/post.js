import {
  getMetadata,
  decorateIcons,
  loadBlock,
  buildBlock,
  decorateBlock,
} from '../../scripts/lib-franklin.js';
import { createElement, getNavPages } from '../../scripts/scripts.js';

async function buildPostData(contentcontainer) {
  const pages = await getNavPages();
  const topic = getMetadata('topic');
  let topicPath = '#';
  pages.forEach((page) => {
    if (page.topic === topic) {
      topicPath = page.path;
    }
  });
  const pubdate = getMetadata('publication-date');
  const readtime = getMetadata('read-time');
  contentcontainer.insertAdjacentHTML('afterbegin', `<p class='blog-category'><a href='${topicPath}'>${topic}</a></p>`);
  contentcontainer.querySelector('h1').insertAdjacentHTML('afterend', `<div class='post-stats'><span class='pubdate'>${pubdate}</span> | <span class="icon icon-clock"></span><span class='readtime'>${readtime}</span></div>`);
  decorateIcons(contentcontainer);
}

export default async function decorate(doc) {
  const contentcontainer = doc.querySelector('.hero-container').nextElementSibling.firstElementChild;
  const classes = ['section'];
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

  buildPostData(contentcontainer);
  const postSidebar = buildBlock('post-sidebar', '');
  sidebar.append(postSidebar);
  sidebarPreviousSection.insertAdjacentElement('beforebegin', sidebar);
  decorateBlock(postSidebar);
  await loadBlock(postSidebar);
}
