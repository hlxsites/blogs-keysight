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
} from './lib-franklin.js';

const LCP_BLOCKS = ['hero', 'featured-posts']; // add your LCP blocks to the list
window.hlx.RUM_GENERATION = 'project-1'; // add your RUM generation information here
window.keysight = window.keysight || {};
window.keysight.postData = window.keysight.postData || {
  posts: [],
  offset: 0,
  allLoaded: false,
};
window.keysight.navPages = window.keysight.navPages || [];
window.keysight.delayed = window.keysight.delayed || [];
window.keysight.delayedReached = false;

/**
 * Create an element with the given id and classes.
 * @param {string} tagName the tag
 * @param {string[]|string} classes the class or classes to add
 * @param {object} props any other attributes to add to the element
 * @returns the element
 */
export function createElement(tagName, classes, props) {
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
  const isProd = window.location.hostname.endsWith('keysight.com');
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
 * loads more data from the query index
 * */
async function loadMorePosts() {
  if (!window.keysight.postData.allLoaded) {
    const queryLimit = 500;
    /*
      console.trace();
      console
      .log(`loading posts with offset ${window.keysight.postData.offset} and limit ${queryLimit}`);
    */
    const resp = await fetch(`/blogs/query-index.json?limit=${queryLimit}&offset=${window.keysight.postData.offset}`);
    const json = await resp.json();
    const { total, data } = json;
    window.keysight.postData.posts.push(...data);
    window.keysight.postData.allLoaded = total <= (window.keysight.postData.offset + queryLimit);
    window.keysight.postData.offset += queryLimit;
  }
}

export async function getNavPages() {
  if (window.keysight.navPages.length === 0) {
    let allLoaded = false;
    const queryLimit = 1000;
    let offset = 0;
    while (!allLoaded) {
      // eslint-disable-next-line no-await-in-loop
      const resp = await fetch(`/blogs/query-index.json?sheet=nav&limit=${queryLimit}&offset=${offset}`);
      // eslint-disable-next-line no-await-in-loop
      const json = await resp.json();
      const { total, data } = json;
      window.keysight.navPages.push(...data);
      allLoaded = total <= (offset + queryLimit);
      offset += queryLimit;
    }
  }

  return window.keysight.navPages;
}

/**
 * @param {boolean} more indicates to force loading additional data from query index
 * @returns the currently loaded listed of posts from the query index pages
 */
export async function loadPosts(more) {
  if (window.keysight.postData.posts.length === 0 || more) {
    await loadMorePosts();
  }
  return window.keysight.postData.posts;
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
 * A function for sorting an array of posts according to what is most cloesely related
 */
function sortRelatedPosts(postA, postB) {
  let postAScore = 0;
  let postBScore = 0;

  // score based on match for tags/topic/subtopic
  // 1 point for each match on topic/subtopic/tag
  const topic = getMetadata('topic');
  const postATopic = postA.topic;
  const postBTopic = postB.topic;
  postAScore += (topic === postATopic) ? 1 : 0;
  postBScore += (topic === postBTopic) ? 1 : 0;

  const subtopic = getMetadata('subtopic');
  const postASubtopic = postA.subtopic;
  const postBSubtopic = postB.subtopic;
  postAScore += (topic === postATopic && subtopic === postASubtopic) ? 1 : 0;
  postBScore += (topic === postBTopic && subtopic === postBSubtopic) ? 1 : 0;

  const tags = getMetadata('article:tag');
  if (tags) {
    const postATags = splitTags(postA.tags);
    if (postATags.length > 0) {
      const commonTags = tags.split(',').filter((tag) => postATags.includes(tag));
      postAScore += commonTags.length;
    }

    const postBTags = splitTags(postB.tags);
    if (postBTags.length > 0) {
      const commonTags = tags.split(',').filter((tag) => postBTags.includes(tag));
      postBScore += commonTags.length;
    }
  }

  // calc result
  const result = postBScore - postAScore;
  if (result === 0) {
    // if they have the same score, sort by date
    const aDate = Number(postA.date);
    const bDate = Number(postB.date);
    return bDate - aDate;
  }

  return result;
}

/**
 * A function for sorting an array of posts by date
 */
function sortPostsByDate(postA, postB) {
  const aDate = Number(postA.date || postA.lastModified);
  const bDate = Number(postB.date || postB.lastModified);
  return bDate - aDate;
}

/**
 * Get the list of blog posts from the query index. Posts are auto-filtered based on page context
 * e.g topic, sub-topic, tags, etc. and sorted by date
 *
 * @param {string} filter the name of the filter to apply
 * one of: topic, subtopic, author, tag, post, auto, none
 * @param {number} limit the number of posts to return, or -1 for no limit
 * @returns the posts as an array
 */
export async function getPosts(filter, limit) {
  const pages = await loadPosts();
  // filter out anything that isn't a blog post (eg. must have an author)
  let finalPosts;
  const allPosts = pages.filter((page) => page.template === 'post');
  const topic = getMetadata('topic');
  const subTopic = getMetadata('subtopic');
  const url = new URL(window.location);
  const params = url.searchParams;
  const tag = params.get('tag');
  const template = getMetadata('template');
  let applicableFilter = filter ? filter.toLowerCase() : 'none';
  if (applicableFilter === 'auto') {
    if (tag) {
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

  if (applicableFilter === 'post') {
    finalPosts = allPosts
      .filter((post) => post.path !== window.location.pathname)
      .sort(sortRelatedPosts);
  } else {
    // first filter out anything with no-index
    finalPosts = allPosts.filter((post) => !post.robots.includes('noindex')).filter((post) => {
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
        matches = author === post.author;
      }
      if (applicableFilter === 'tag') {
        // used for the tag-matches page, where tag is passed in a query param
        const postTags = splitTags(post.tags);
        if (tag) {
          matches = postTags.includes(tag);
        }
      }
      return matches;
    }).sort(sortPostsByDate);
  }

  return limit < 0 ? finalPosts : finalPosts.slice(0, limit);
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
      const desc = h1.parentElement.querySelector('h1 + p');
      if (desc) {
        elems.push(desc);
        const buttons = h1.parentElement.querySelector('h1 + p + .button-container');
        if (buttons) {
          elems.push(buttons);
        }
      } else {
        const buttons = h1.parentElement.querySelector('h1 + .button-container');
        if (buttons) {
          elems.push(buttons);
        }
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
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
    buildImageBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
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
  link.type = 'image/svg+xml';
  link.href = href;
  const existingLink = document.querySelector('head link[rel="icon"]');
  if (existingLink) {
    existingLink.parentElement.replaceChild(link, existingLink);
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

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/fonts/fonts.css`);
  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  addFavIcon(`${window.hlx.codeBasePath}/icons/favicon.ico`);
  sampleRUM('lazy');
  sampleRUM.observe(main.querySelectorAll('div[data-block-name]'));
  sampleRUM.observe(main.querySelectorAll('picture > img'));
}

/**
 * loads everything that happens a lot later, without impacting
 * the user experience.
 */
function loadDelayed() {
  window.setTimeout(() => {
    // execute any delayed functions
    window.keysight.delayedReached = true;
    window.keysight.delayed.forEach((func) => func());
  }, 1500);
  window.setTimeout(() => {
    // eslint-disable-next-line import/no-cycle
    import('./delayed.js');
  }, 3000);
  // load anything that can be postponed to the latest here
}

/**
 * Execute a function of a delayed basis.
 * @param {function} func the function to execute
 */
export function execDeferred(func) {
  if (window.keysight.delayedReached) {
    func();
  } else {
    window.keysight.delayed.push(func);
  }
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
