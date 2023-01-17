import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import { createElement, loadPosts, addOutsideClickListener } from '../../scripts/scripts.js';

async function getTopicNavData() {
  const pages = await loadPosts();
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
          subtopics: [],
        });
      } else {
        pageTopicItem.href = page.path;
      }
      topicNav[pageTopic] = pageTopicItem;
    }
  });
  return topicNav;
}

function buildNav(ul, navItems, topicType) {
  Object.values(navItems).forEach((navItem) => {
    const topicLi = createElement('li', `nav-${topicType}`);
    topicLi.innerHTML = `<a href="${navItem.href}">${navItem.title}</a>`;
    if (navItem.subtopics.length > 0) {
      const topicUl = createElement('ul');
      buildNav(topicUl, navItem.subtopics, 'sub-topic');
      topicLi.append(topicUl);
    }
    ul.append(topicLi);
  });
}

/**
 * decorates the block
 * @param {Element} block The topics block element
 */
export default async function decorate(block) {
  const topicNav = await getTopicNavData();
  const topic = getMetadata('topic');

  let title = 'Topics';
  if (topic) {
    title = 'Subtopics';
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
  if (topic) {
    buildNav(topicList, topicNav[topic].subtopics, 'sub-topic');
  } else {
    buildNav(topicList, topicNav, 'topic');
  }

  nav.append(topicList);
  decorateIcons(nav);
  block.append(nav);
}
