import { readBlockConfig, decorateIcons } from '../../scripts/lib-franklin.js';
import { wrapImgsInLinks, createElement } from '../../scripts/scripts.js';

/**
 * collapses all open nav sections
 * @param {Element} sections The container element
 */

function collapseAllNavSections(sections) {
  sections.querySelectorAll('.nav-sections > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', 'false');
  });
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  // fetch nav content
  const navPath = cfg.nav || '/nav';
  const resp = await fetch(`${navPath}.plain.html`);
  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = createElement('nav');
    nav.innerHTML = html;
    decorateIcons(nav);

    const classes = ['brand', 'blog-home', 'sections', 'tools'];
    classes.forEach((e, j) => {
      const section = nav.children[j];
      if (section) section.classList.add(`nav-${e}`);
    });

    const navSections = [...nav.children][2];
    if (navSections) {
      navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
        if (navSection.querySelector('ul')) {
          const navSectionLink = navSection.querySelector('a');

          const navSectionLinkClone = navSectionLink.cloneNode(true);
          const navSectionLi = document.createElement('li');
          navSectionLinkClone.insertAdjacentHTML('beforeend', '<span class="icon icon-chevron-right"></span>');
          navSectionLi.append(navSectionLinkClone);
          navSection.querySelector('ul').prepend(navSectionLi);

          navSectionLink.insertAdjacentHTML('beforeend', '<span class="icon icon-chevron-down"></span>');

          navSection.classList.add('nav-drop');
          navSection.setAttribute('aria-expanded', 'false');

          navSectionLink.addEventListener('click', (e) => {
            e.preventDefault();
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            collapseAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          });
        }
      });
    }

    // hamburger for mobile
    const hamburger = createElement('div', '', 'nav-hamburger');
    hamburger.innerHTML = '<div class="nav-hamburger-icon"></div>';
    hamburger.addEventListener('click', () => {
      const expanded = nav.getAttribute('aria-expanded') === 'true';
      nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
    nav.prepend(hamburger);
    nav.setAttribute('aria-expanded', 'false');
    decorateIcons(nav);
    wrapImgsInLinks(nav);
    block.append(nav);
    block.classList.add('appear');
  }
}
