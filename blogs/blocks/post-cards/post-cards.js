import {
  createElement,
  splitTags,
  getPostsFfetch,
  filterPosts,
} from '../../scripts/scripts.js';
import {
  createOptimizedPicture,
  readBlockConfig,
  decorateIcons,
  getMetadata,
  decorateBlock,
  loadBlock,
  buildBlock,
} from '../../scripts/lib-franklin.js';
import ffetch from '../../scripts/ffetch.js';
import { validateTags } from '../../scripts/taxonomy.js';

let pageSize = 7;

function showHideMore(grid, moreContainer) {
  const hidden = grid.querySelector('.post-card.hidden');
  if (hidden) {
    moreContainer.style.display = '';
  } else {
    moreContainer.style.display = 'none';
  }
}

async function getTopicLink(post) {
  const { topic, subtopic } = post;
  let topicText = topic;
  if (subtopic && subtopic !== '0') {
    topicText = subtopic;
  }

  const notLink = createElement('span');
  notLink.innerText = topicText;

  const topicPage = await ffetch('/blogs/query-index.json').sheet('nav')
    .filter((page) => page.topic === topic && page.subtopic === subtopic).first();

  if (topicPage) {
    const link = createElement('a');
    link.href = topicPage.path;
    link.innerText = topicText;
    return link;
  }

  return notLink;
}

async function getAuthorLink(post) {
  const { author } = post;
  const notLink = createElement('span');
  notLink.innerText = `${author}`;

  const authorPage = await ffetch('/blogs/query-index.json').sheet('nav')
    .filter((page) => page.title.toLowerCase() === author?.toLowerCase()).first();

  if (authorPage) {
    const link = createElement('a');
    link.href = authorPage.path;
    link.innerText = `${author}`;
    return link;
  }

  return notLink;
}

async function getTagsLinks(post) {
  const tags = splitTags(post.tags);
  if (tags.length > 0) {
    const [validTags] = await validateTags(tags);
    const list = createElement('ul', 'card-tags');
    validTags.forEach((tag) => {
      const item = createElement('li');
      const link = createElement('a');
      link.innerText = `#${tag}`;
      link.href = `/blogs/tag-matches?tag=${encodeURIComponent(tag)}`;

      item.append(link);
      list.append(item);

    });
    return list;
  }
  return undefined;
}

async function buildPostCard(post, index) {
  const classes = ['post-card', 'hidden'];
  const isAnAuthorPage = getMetadata('template') === 'author';
  if (!isAnAuthorPage && index % 7 === 3) {
    classes.push('featured');
  }
  const postCard = createElement('div', classes);

  let postDateStr = '';
  if (post.date) {
    try {
      const dateinMs = Number(post.date) * 1000;
      const postDate = new Date(dateinMs);
      const year = postDate.getUTCFullYear();
      let month = postDate.getUTCMonth() + 1;
      if (month < 10) {
        month = `0${month}`;
      }
      let date = postDate.getUTCDate();
      if (date < 10) {
        date = `0${date}`;
      }
      postDateStr = ` | ${year}.${month}.${date}`;
    } finally {
      // no op
    }
  }

  let picMedia = [{ media: '(min-width: 600px)', width: '450' }, { width: '600' }];
  if (classes.includes('featured')) {
    picMedia = [{ media: '(min-width: 900px)', width: '1200' }, { width: '600' }];
  }
  const pic = createOptimizedPicture(post.image, '', false, picMedia);
  const { topic, subtopic } = post;
  let topicText = topic;
  if (subtopic && subtopic !== '0') {
    topicText = subtopic;
  }

  const description = post.content !== '0' ? post.content : post.description;

  postCard.innerHTML = `
    <a class="post-card-image" title="${post.title.replaceAll('"', '')}" href="${post.path}">${pic.outerHTML}</a>
    <div class="post-card-text">
      <p class="card-topic"><span class="topic-text">${topicText}</span></p>
      <p class="card-title"><a href="${post.path}">${post.title}</a></p>
      <p class="card-author"><span class="author-text">${post.author}</span><span class="card-date">${postDateStr}</span></p>
      <div class="card-description"><p class="card-description-text">${description.substr(0, 500)}</p></div>
    </div>
  `;

  if (post.readtime && post.readtime !== '0') {
    postCard.querySelector('.post-card-text').insertAdjacentHTML('beforeend', `<p class="card-read"><span class="icon icon-clock"></span>${post.readtime}</p>`);
  }

  const topicLinkPromise = getTopicLink(post);
  topicLinkPromise.then((topicLink) => {
    if (topicLink) {
      postCard.querySelector('.card-topic')
        .replaceChild(topicLink, postCard.querySelector('.card-topic .topic-text'));
    }
  });

  const authorLinkPromise = getAuthorLink(post);
  authorLinkPromise.then((authorLink) => {
    if (authorLink) {
      postCard.querySelector('.card-author')
        .replaceChild(authorLink, postCard.querySelector('.card-author .author-text'));
    }
  });

  const tagsLinks = await getTagsLinks(post);
  if (tagsLinks) {
    postCard.querySelector('.post-card-text').append(tagsLinks);
  }

  decorateIcons(postCard);
  return postCard;
}

async function loadPage(grid) {
  const { filter } = grid.dataset;
  const limit = Number(grid.dataset.limit);
  let counter = Number(grid.dataset.loadedCount);
  if (limit > 0 && counter >= limit) {
    return;
  }
  const end = limit > 0 ? (limit + counter) : (pageSize + counter);
  const postsGenerator = getPostsFfetch()
    .filter(filterPosts(filter))
    .slice(counter, end);

  const hasCta = grid.dataset.hasCta === 'true';
  // eslint-disable-next-line no-restricted-syntax
  for await (const post of postsGenerator) {
    const postCard = await buildPostCard(post, hasCta ? counter + 1 : counter);
    grid.append(postCard);
    counter += 1;
  }
  grid.dataset.loadedCount = counter;
}

function showPage(grid) {
  for (let i = 0; i < pageSize; i += 1) {
    const post = grid.querySelector('.post-card.hidden');
    if (post) {
      post.classList.remove('hidden');
    }
  }
}

async function loadPostCards(block) {
  const grid = block.querySelector('.post-cards-grid');
  const moreContainer = block.querySelector('.show-more-cards-container');

  if (getMetadata('template') !== 'post') {
    // if not a blog post, check if we have a cta to load
    const ctaPath = getMetadata('cta');
    if (ctaPath) {
      const relLink = new URL(ctaPath).pathname;
      const link = createElement('a');
      link.href = relLink;
      const fragmentBlock = buildBlock('fragment', [['Source', link]]);
      const ctaPostCard = createElement('div', ['post-card', 'hidden']);
      ctaPostCard.append(fragmentBlock);
      decorateBlock(fragmentBlock);
      grid.dataset.hasCta = true;
      grid.append(ctaPostCard);
      loadBlock(fragmentBlock);
    }
  }
  // load the first 2 pages, show 1
  await loadPage(grid);
  await loadPage(grid);
  showPage(grid);

  showHideMore(grid, moreContainer);
  // post a message indicating cards are loaded, this triggers the tags block to load
  // see comment there for more details
  block.dataset.postsLoaded = 'true';
  window.postMessage({ postCardsLoaded: true }, window.location.origin);
}

/**
 * decorates the block
 * @param {Element} block The featured posts block element
 */
export default function decorate(block) {
  const isAnAuthorPage = getMetadata('template') === 'author';
  if (isAnAuthorPage) pageSize = 9;
  const conf = readBlockConfig(block);
  const { limit, filter } = conf;
  const limitNumber = limit || -1;
  const applicableFilter = filter || 'auto';
  const grid = createElement('div', 'post-cards-grid', {
    'data-limit': limitNumber,
    'data-filter': applicableFilter,
    'data-loaded-count': 0,
  });

  const moreButton = createElement('button', 'show-more-cards');
  moreButton.innerText = 'Show More';
  const moreContainer = createElement('div', 'show-more-cards-container');
  moreContainer.append(moreButton);
  moreButton.addEventListener('click', async () => {
    showPage(grid);
    await loadPage(grid);
    showHideMore(grid, moreContainer);
  });

  block.innerHTML = '';
  block.append(grid);
  block.append(moreContainer);
  showHideMore(grid, moreContainer);

  block.dataset.postsLoaded = 'false';
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      loadPostCards(block);
    }
  }, { rootMargin: '100px' });
  if (getMetadata('template') === 'post') {
    block.closest('.section').id = 'blogs_related_posts';
  }

  observer.observe(block);
}
