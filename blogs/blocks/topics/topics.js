import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';
import { createElement, addOutsideClickListener } from '../../scripts/scripts.js';

function buildNav(ul, navItems, topic) {
  navItems.querySelectorAll(':scope > li').forEach((topicLi) => {
    topicLi.classList.add('nav-topic');
    const subtopicUl = topicLi.querySelector(':scope > ul');
    if (subtopicUl) {
      subtopicUl.querySelectorAll(':scope > li').forEach((subtopicLi) => {
        subtopicLi.classList.add('nav-sub-topic');
      });
    }

    if (!topic) {
      ul.append(topicLi);
    } else {
      const topicLink = topicLi.querySelector(':scope > a');
      if (topicLink.getAttribute('href') === window.location.pathname) {
        topicLi.querySelectorAll('.nav-sub-topic').forEach((el) => {
          ul.append(el);
        });
      }
    }
  });
}

/**
 * decorates the block
 * @param {Element} block The topics block element
 */
export default async function decorate(block) {
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

  const resp = await fetch('/blogs/nav.plain.html');
  if (resp.ok) {
    const html = await resp.text();
    const temp = createElement('div');
    temp.innerHTML = html;
    const topicNav = temp.querySelector('div:nth-child(3) > ul');
    if (topic) {
      buildNav(topicList, topicNav, topic);
    } else {
      buildNav(topicList, topicNav);
    }
  }

  nav.append(topicList);
  decorateIcons(nav);
  block.append(nav);
}
