import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import { createElement, getPages, addOutsideClickListener } from '../../scripts/scripts.js';

async function buildTopicNav() {
  const pages = await getPages();
  const topicNav = {};
  pages.forEach((page) => {
    const pageTopic = page.topic;
    const pageSubTopic = page.subtopic;
    const pageAuthor = page.author;
    if (pageTopic && !pageAuthor) {
      let pageTopicItem = topicNav[pageTopic];
      if (!pageTopicItem) {
        pageTopicItem = {
          title: pageTopic,
          href: '',
          subtopics: [],
        };
      }
      if (pageSubTopic) {
        pageTopicItem.subtopics.push({
          title: pageSubTopic,
          href: page.path,
        });
      } else {
        pageTopicItem.href = page.path;
      }
      topicNav[pageTopic] = pageTopicItem;
    }
  });
  return topicNav;
}

/**
 * decorates the block
 * @param {Element} block The topics block element
 */
export default async function decorate(block) {
  const topicNav = await buildTopicNav();
  const topic = getMetadata('topic');

  let title = 'Topics';
  let navItems = topicNav;
  if (topic) {
    // nav on subtopic landing pages
    title = 'Subtopics';
    navItems = topicNav[topic];
  }
  const nav = createElement('nav', 'topics-nav', {
    'aria-expanded': 'false',
  });
  const navTitle = createElement('a', ['nav-title', 'heading', 'heading-h3']);
  navTitle.href = '#';
  navTitle.innerHTML = `<span>${title}</span><span class="icon icon-chevron-down"></span>`;
  navTitle.addEventListener('click', (e) => {
    e.preventDefault();
    const expanded = nav.getAttribute('aria-expanded') === 'true';
    nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    if (!expanded) {
      addOutsideClickListener(nav, () => {
        nav.setAttribute('aria-expanded', 'false');
      });
    }
  });
  nav.append(navTitle);

  const topicList = createElement('ul', 'topics-list');
  Object.values(navItems).forEach((navItem) => {
    const topicLi = createElement('li', 'nav-topic');
    topicLi.innerHTML = `<a href="${navItem.href}">${navItem.title}</a>`;
    if (navItem.subtopics.length > 0) {
      const topicUl = createElement('ul');
      navItem.subtopics.forEach((navSubItem) => {
        const subtopicLi = createElement('li', 'nav-sub-topic');
        subtopicLi.innerHTML = `<a href="${navSubItem.href}">${navSubItem.title}</a>`;
        topicUl.append(subtopicLi);
      });
      topicLi.append(topicUl);
    }
    topicList.append(topicLi);
  });
  nav.append(topicList);
  decorateIcons(nav);
  block.append(nav);
}
