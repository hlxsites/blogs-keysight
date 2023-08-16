import ffetch from './ffetch.js';
import {
  sampleRUM,
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  getMetadata,
  waitForLCP,
  loadBlocks,
  loadCSS,
  fetchPlaceholders,
  createOptimizedPicture,
  decorateBlock,
  loadBlock,
} from './lib-franklin.js';
import { validateBackOfficeTags, validateHashTags, findTag } from './taxonomy.js';

const LCP_BLOCKS = ['hero', 'featured-posts']; // add your LCP blocks to the list
window.hlx.RUM_GENERATION = 'project-1'; // add your RUM generation information here
export const PRODUCTION_DOMAINS = ['www.keysight.com', 'stgwww.keysight.com'];
export const PRODUCTION_PATHS = ['/blogs/'];

/**
 * Create an element with the given id and classes.
 * @param {string} tagName the tag
 * @param {string[]|string} classes the class or classes to add
 * @param {object} props any other attributes to add to the element
 * @param {string|Element} html content to add
 * @returns the element
 */
export function createElement(tagName, classes, props, html) {
  const elem = document.createElement(tagName);
  if (classes) {
    const classesArr = (typeof classes === 'string') ? [classes] : classes;
    elem.classList.add(...classesArr);
  }
  if (props) {
    Object.keys(props).forEach((propName) => {
      elem.setAttribute(propName, props[propName]);
    });
  }
  if (html) {
    const appendEl = (el) => {
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        elem.append(el);
      } else {
        elem.insertAdjacentHTML('beforeend', el);
      }
    };

    if (Array.isArray(html)) {
      html.forEach(appendEl);
    } else {
      appendEl(html);
    }
  }

  return elem;
}

/**
 * load a script by adding to page head
 * @param {string} url the script src url
 * @param {string} type the script type
 * @param {function} callback a funciton to callback after loading
 */
export function loadScript(url, type, callback) {
  const head = document.querySelector('head');
  let script = head.querySelector(`script[src="${url}"]`);
  if (!script) {
    script = document.createElement('script');
    script.src = url;
    if (type) script.setAttribute('type', type);
    head.append(script);
    script.onload = callback;
    return script;
  }
  return script;
}

/**
 * Load the launch library applicable to the domain
 */
export function loadLaunch() {
  const isProd = window.location.hostname === 'www.keysight.com';
  const launchProd = 'https://assets.adobedtm.com/af12bb6c0390/f1190bca45f3/launch-6bc4c4772e81.min.js';
  const launchStaging = 'https://assets.adobedtm.com/af12bb6c0390/f1190bca45f3/launch-9dfc78dfe662-staging.min.js';
  loadScript(isProd ? launchProd : launchStaging);
}

/**
 * Add a listener for clicks outside an element, and execute the callback when they happen.
 * useful for closing menus when they are clicked outside of.
 * @param {Element} elem the element
 * @param {function} callback the callback function
 */
export function addOutsideClickListener(elem, callback) {
  let outsideClickListener;
  const removeClickListener = (() => {
    document.removeEventListener('click', outsideClickListener);
  });
  outsideClickListener = ((event) => {
    if (!elem.contains(event.target)) {
      callback();
      removeClickListener();
    }
  });
  document.addEventListener('click', outsideClickListener);
}

/**
 * Wraps images followed by links within a matching <a> tag.
 * @param {Element} pic The picture element to wrap
 */
export function wrapImgInLink(pic) {
  const parent = pic.parentNode;
  const link = parent?.nextElementSibling?.querySelector('a');
  if (link && link.textContent.includes(link.getAttribute('href'))) {
    link.parentElement.remove();
    link.innerHTML = pic.outerHTML;
    parent.append(link);
    pic.remove();

    return link;
  }

  return pic;
}

/**
 * forward looking *.metadata.json experiment
 * fetches metadata.json of page
 * @param {path} path to *.metadata.json
 * @returns {Object} containing sanitized meta data
 */
export async function getMetadataJson(path) {
  let resp;
  try {
    resp = await fetch(path);
    if (resp && resp.ok) {
      const text = await resp.text();
      const headStr = text.split('<head>')[1].split('</head>')[0];
      const head = document.createElement('head');
      head.innerHTML = headStr;
      const metaTags = head.querySelectorAll(':scope > meta');
      const meta = {};
      metaTags.forEach((metaTag) => {
        const name = metaTag.getAttribute('name') || metaTag.getAttribute('property');
        const value = metaTag.getAttribute('content');
        if (meta[name]) {
          meta[name] += `, ${value}`;
        } else {
          meta[name] = value;
        }
      });

      if (meta['og:image'].includes('/default-meta-image')) {
        meta['og:image'] = '/blogs/generic-post-image.jpg?width=1200&format=pjpg&optimize=medium';
      }

      return meta;
    }
  } catch {
    // fail
  }

  return null;
}

/**
 * split the tags string into a string array
 * @param {string} tags the tags string from query index
 */
export function splitTags(tags) {
  if (tags) {
    return JSON.parse(tags);
  }
  return [];
}

/**
 * get the blog posts via ffetch
 * @returns an ffetch generator, which can then be filtered, sliced, etc.
 */
export function getPostsFfetch() {
  const posts = ffetch('/blogs/query-index.json')
    .chunks(500)
    .filter((page) => page.template === 'post')
    .map((p) => {
      if (p.image.includes('/default-meta-image')) {
        p.image = '/blogs/generic-post-image.jpg?width=1200&format=pjpg&optimize=medium';
      }
      return p;
    });

  return posts;
}

function getApplicableFilter(filterName, pageTag) {
  let applicableFilter = filterName ? filterName.toLowerCase() : 'none';
  const topic = getMetadata('topic');
  const subTopic = getMetadata('subtopic');
  const template = getMetadata('template');
  if (applicableFilter === 'auto') {
    if (pageTag) {
      applicableFilter = 'tag';
    } else if (template === 'author') {
      applicableFilter = 'author';
    } else if (template === 'post') {
      applicableFilter = 'post';
    } else if (topic && subTopic) {
      applicableFilter = 'subtopic';
    } else if (topic) {
      applicableFilter = 'topic';
    } else {
      applicableFilter = 'none';
    }
  }

  return applicableFilter;
}

/**
 * Get the tag passed to the page via query parameter
 * @returns the tag object for the tag usp
 */
export async function getPageTag() {
  let pageTag;
  const url = new URL(window.location);
  const params = url.searchParams;
  const tag = params.get('tag');
  if (tag) {
    const [validTags] = await validateHashTags([tag]);
    if (validTags.length > 0) {
      [pageTag] = validTags;
    }
  }
  return pageTag;
}

/**
 * get a function to use for filtering posts. To be used in conjunction with
 * getPostsFfetch()
 * @param {string} filterName the name of the filter to apply
 * @param {object} pageTag a tag object to use with filter,
 * usually passed as a tag title via url param and resolved before calling this.
 * @param {object[]} pageTags an array of tag object to use with filter for related posts
 * @returns {function} a function for filtering posts based on the filter name
 */
export function filterPosts(filterName, pageTag, pageTags) {
  const applicableFilter = getApplicableFilter(filterName, pageTag);
  const filterFunc = (post) => {
    if (applicableFilter === 'post') {
      const isDiffPath = post.path !== window.location.pathname;
      const postTags = splitTags(post.tags);
      const hasCommonTags = postTags.some((tag) => findTag(tag, pageTags) !== undefined);
      return isDiffPath && hasCommonTags;
    }

    const topic = getMetadata('topic');
    const subTopic = getMetadata('subtopic');
    let matches = true;
    if (applicableFilter === 'topic') {
      matches = topic === post.topic;
    }
    if (applicableFilter === 'subtopic') {
      matches = topic === post.topic && subTopic === post.subtopic;
    }
    if (applicableFilter === 'author') {
      // on author pages the author name is the title
      const author = getMetadata('originalTitle');
      matches = author.toLowerCase() === post.author.toLowerCase();
    }
    if (applicableFilter === 'tag') {
      // used for the tag-matches page, where tag is passed in a query param
      const postTags = splitTags(post.tags);
      if (pageTag) {
        matches = postTags.some((t) => findTag(t, [pageTag]) !== undefined);
      }
    }
    return matches;
  };

  return filterFunc;
}

function findImageCaption(img) {
  const sibling = img.nextElementSibling;
  if (sibling && sibling.nodeName === 'EM') {
    return sibling;
  }
  const parent = img.parentNode;
  const parentSibling = parent.nextElementSibling;
  return parentSibling && parentSibling.firstChild.nodeName === 'EM' ? parentSibling : undefined;
}

function buildImageBlocks(main) {
  const imgs = [...main.querySelectorAll(':scope > div > p > picture')];
  imgs.forEach((img) => {
    const linkOrImg = wrapImgInLink(img);
    const parent = linkOrImg.parentNode;
    const caption = findImageCaption(linkOrImg);
    const imgBlock = buildBlock('image', {
      elems: [linkOrImg, caption],
    });
    parent.insertAdjacentElement('beforebegin', imgBlock);
  });
}

function buildHeroBlock(main) {
  if (document.body.classList.contains('post')) {
    const heroImg = main.querySelector(':scope > div:first-child picture');
    if (!heroImg) {
      const section = createElement('div');
      const pic = createOptimizedPicture('/blogs/generic-post-image.jpg', 'Post Hero Image', true);
      section.append(pic);
      main.prepend(section);
    }
  }

  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  const pictureParent = picture?.parentElement;
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = picture.closest('div');
    const elems = [picture];
    const h1Section = h1.closest('div');
    if (h1Section === section) {
      elems.push(h1);
      let nextSib = h1.nextElementSibling;
      while (nextSib && (nextSib.tagName === 'P' || nextSib.classList.contains('button-container'))) {
        elems.push(nextSib);
        nextSib = nextSib.nextElementSibling;
      }
    }
    section.append(buildBlock('hero', { elems }));
    // picture was likely wrapped in a p that is now empty, so remove that
    if (pictureParent && pictureParent.tagName === 'P' && pictureParent.innerText.trim() === '') {
      pictureParent.remove();
    }
  }
}

/**
 * Decorate links that end with -block-modal to open a modal window
 * @param {Element} main The main element
 */
function buildModalBlocks(main) {
  const section = createElement('div');
  let hasModals = false;
  main.querySelectorAll('a[href*="modal"]').forEach((a, i) => {
    if (a.href.endsWith('-block-modal')) {
      hasModals = true;
      const modalBlock = buildBlock('modal', a.cloneNode(true));
      const modalId = `modal-block-${i}`;
      modalBlock.setAttribute('data-modal-id', modalId);
      a.setAttribute('aria-controls', modalId);
      section.append(modalBlock);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        window.postMessage({ showModal: true, modalId }, window.location.origin);
      });
    }
  });

  if (hasModals) {
    main.append(section);
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main, isFragment = false) {
  try {
    if (!isFragment) {
      buildHeroBlock(main);
    }
    buildImageBlocks(main);
    buildModalBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * decorate links to by making them relative and setting the target
 *
 * @param {Element} element the element containing the links to decorate
 */
export function decorateLinks(element) {
  element.querySelectorAll('a').forEach((a) => {
    if (a.href) {
      try {
        const url = new URL(a.href);
        const hosts = ['hlx.page', 'hlx.live', ...PRODUCTION_DOMAINS];
        const hostMatch = hosts.some((host) => url.hostname.includes(host));
        const pathMatch = PRODUCTION_PATHS.some((path) => url.pathname.startsWith(path));
        if (hostMatch) {
          if (pathMatch) {
            a.href = `${url.pathname.replace('.html', '')}${url.search}${url.hash}`;
          }
        } else {
          a.target = '_blank';
        }
      } catch (e) {
        // something went wrong
        // eslint-disable-next-line no-console
        console.log(e);
      }
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main, isFragment = false) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  decorateLinks(main);
  buildAutoBlocks(main, isFragment);
  decorateSections(main);
  decorateBlocks(main);
}

async function loadTemplate(doc, templateName) {
  try {
    const cssLoaded = new Promise((resolve) => {
      loadCSS(`${window.hlx.codeBasePath}/templates/${templateName}/${templateName}.css`, resolve);
    });
    const decorationComplete = new Promise((resolve) => {
      (async () => {
        try {
          const mod = await import(`../templates/${templateName}/${templateName}.js`);
          if (mod.default) {
            await mod.default(doc);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(`failed to load module for ${templateName}`, error);
        }
        resolve();
      })();
    });
    await Promise.all([cssLoaded, decorationComplete]);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(`failed to load block ${templateName}`, error);
  }
}

/**
 * loads everything needed to get to LCP.
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    await waitForLCP(LCP_BLOCKS);
  }
}

/**
 * Adds the favicon.
 * @param {string} href The favicon URL
 */
export function addFavIcon(href) {
  const link = createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.replaceWith(link);
  } else {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
}

async function updatePlaceholders() {
  // replace the tag in body content and meta tags
  const url = new URL(window.location);
  const params = url.searchParams;
  const tag = params.get('tag');
  if (tag) {
    const recurse = (el) => {
      if (el.nodeType === 3) {
        // text node
        const text = el.textContent;
        if (text.includes('__tag__')) {
          const newText = text.replaceAll('__tag__', tag);
          el.textContent = newText;
        }
      } else {
        el.childNodes.forEach((child) => {
          recurse(child);
        });
      }
    };

    recurse(document);
    document.querySelectorAll('head > meta').forEach((meta) => {
      const text = meta.content;
      const newText = text.replaceAll('__tag__', tag);
      meta.content = newText;
    });
  }

  const placeholders = await fetchPlaceholders();
  if (placeholders.titleSuffix) {
    const title = document.querySelector('head > title');

    const originalTitle = createElement('meta', '', {
      name: 'originalTitle',
      content: title.textContent,
    });
    document.querySelector('head').append(originalTitle);

    const ogTitle = document.querySelector('head > meta[property="og:title"]');
    const twitterTitle = document.querySelector('head > meta[name="twitter:title"]');
    const withSuffix = `${title.textContent} ${placeholders.titleSuffix}`;
    document.querySelector('head > title').textContent = withSuffix;
    ogTitle.content = withSuffix;
    twitterTitle.content = withSuffix;
  }
}

/**
 * Validate and add Back Office Tags to the page
 */
export async function addBackOfficeMetaTags() {
  // add back office tags to head
  const backoffice = getMetadata('back-office-tags');
  if (backoffice) {
    const tags = backoffice.split(',').map((t) => t.trim());
    const [validTags] = await validateBackOfficeTags(tags, 'en');
    validTags.forEach((tag) => {
      const { TAG_PATH } = tag;
      const parts = TAG_PATH.replace('/content/cq:tags/segmentation/', '').split('/');
      const group = parts.shift();
      const tagVal = parts.pop();
      const existingTag = document.querySelector(`meta[name="${group}`);
      if (existingTag) {
        const existingContent = existingTag.getAttribute('content');
        const newContent = `${existingContent},${tagVal}`;
        existingTag.setAttribute('content', newContent);
      } else {
        const metaTag = createElement('meta', '', {
          name: group,
          content: tagVal,
        });
        document.head.append(metaTag);
      }
    });
  }
}

/**
 * loads everything that doesn't need to be delayed.
 */
async function loadLazy(doc) {
  updatePlaceholders();

  const templateName = getMetadata('template');
  if (templateName) {
    await loadTemplate(doc, templateName);
  }

  const main = doc.querySelector('main');
  await loadBlocks(main);

  const { hash } = window.location;
  const element = hash ? main.querySelector(hash) : false;
  if (hash && element) element.scrollIntoView();

  const header = doc.querySelector('header');
  const footer = doc.querySelector('footer');
  loadHeader(header);
  loadFooter(footer);

  // analytics ids
  main.id = 'mainsection';
  header.id = 'header';
  footer.id = 'footer';

  loadCSS(`${window.hlx.codeBasePath}/fonts/fonts.css`);
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  addFavIcon(`${window.hlx.codeBasePath}/icons/favicon.png`);

  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

function initSidekick() {
  let sk = document.querySelector('helix-sidekick');
  const preflightEventListener = () => {
    const pfModel = document.querySelector('#preflight-dialog');
    if (!pfModel) {
      const pf = buildBlock('preflight', '');
      document.querySelector('main').append(pf);
      decorateBlock(pf);
      loadBlock(pf);
    } else {
      window.postMessage({ preflightInit: true }, window.location.origin);
    }
  };

  if (sk) {
    sk.addEventListener('custom:preflight', preflightEventListener);
  } else {
    // wait for sidekick to be loaded
    document.addEventListener('helix-sidekick-ready', () => {
      sk = document.querySelector('helix-sidekick');
      sk.addEventListener('custom:preflight', preflightEventListener);
    }, { once: true });
  }
}

/**
 * loads everything that happens a lot later, without impacting
 * the user experience.
 */
function loadDelayed() {
  // load the delayed script
  const delayedScript = '/blogs/scripts/delayed.js';
  const usp = new URLSearchParams(window.location.search);
  const delayed = usp.get('delayed');

  if (!(delayed === 'off' || document.querySelector(`head script[src="${delayedScript}"]`))) {
    let ms = 4000;
    const delay = usp.get('delay');
    if (delay) ms = +delay;
    setTimeout(() => {
      loadScript(delayedScript, 'module');
    }, ms);
  }

  initSidekick();
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
