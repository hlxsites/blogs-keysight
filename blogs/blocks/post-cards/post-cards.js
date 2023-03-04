import {
  getPosts,
  createElement,
  loadPosts,
  splitTags,
  getNavPages,
} from '../../scripts/scripts.js';
import {
  createOptimizedPicture,
  readBlockConfig,
  decorateIcons,
  getMetadata,
} from '../../scripts/lib-franklin.js';

const pageSize = 7;

function showHideMore(grid, moreContainer) {
  const hidden = grid.querySelector('.post-card.hidden');
  if (hidden) {
    moreContainer.style.display = '';
  } else {
    moreContainer.style.display = 'none';
  }
}

function getTopicLink(post, navPages) {
  const { topic, subtopic } = post;
  let topicText = topic;
  if (subtopic && subtopic !== '0') {
    topicText = subtopic;
  }

  const notLink = createElement('span');
  notLink.innerText = topicText;

  try {
    const topicPage = navPages.find((page) => page.topic === topic && page.subtopic === subtopic);
    if (topicPage) {
      const link = createElement('a');
      link.href = topicPage.path;
      link.innerText = topicText;
      return link;
    }
  } finally {
    // no op, just fall through to return default
  }

  return notLink;
}

function getAuthorLink(post, navPages) {
  const { author } = post;
  const notLink = createElement('span');
  notLink.innerText = `${author}`;

  try {
    const authorPage = navPages.find((page) => page.title === author);
    if (authorPage) {
      const link = createElement('a');
      link.href = authorPage.path;
      link.innerText = `${author}`;
      return link;
    }
  } finally {
    // no op, just fall through to return default value
  }

  return notLink;
}

function getTagsLinks(post) {
  const tags = splitTags(post.tags);
  if (tags.length > 0) {
    const list = createElement('ul', 'card-tags');
    tags.forEach((tag) => {
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

function buildPostCard(post, index, navPagesPromise) {
  const classes = ['post-card', 'hidden'];
  const isAnAuthorPage = getMetadata('template') === 'author';
  if (!isAnAuthorPage && index % 7 === 3) {
    classes.push('featured');
  }
  const postCard = createElement('div', classes);

  let postDateStr = '';
  if (post.date) {
    try {
      const postDate = new Date(Number(post.date) * 1000);
      const year = postDate.getFullYear();
      let month = postDate.getMonth() + 1;
      if (month < 10) {
        month = `0${month}`;
      }
      const date = postDate.getDate();
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
  postCard.innerHTML = `
    <a class="post-card-image" title="${post.title.replaceAll('"', '')}" href="${post.path}">${pic.outerHTML}</a>
    <div class="post-card-text">
      <p class="card-topic"><span class="topic-text">${topicText}</span></p>
      <p class="card-title"><a href="${post.path}">${post.title}</a></p>
      <p class="card-author"><span class="author-text">${post.author}</span><span class="card-date">${postDateStr}</span></p>
      <div class="card-description"><p class="card-description-text">${post.description}</p></div>
      <p class="card-read"><span class="icon icon-clock"></span>${post.readtime}</p>
    </div>
  `;
  navPagesPromise.then((navPages) => {
    const topicLink = getTopicLink(post, navPages);
    if (topicLink) {
      postCard.querySelector('.card-topic').replaceChild(topicLink, postCard.querySelector('.card-topic .topic-text'));
    }
    const authorLink = getAuthorLink(post, navPages);
    if (authorLink) {
      postCard.querySelector('.card-author').replaceChild(authorLink, postCard.querySelector('.card-author .author-text'));
    }
  });

  const tagsLinks = getTagsLinks(post);
  if (tagsLinks) {
    postCard.querySelector('.post-card-text').append(tagsLinks);
  }

  decorateIcons(postCard);
  return postCard;
}

async function loadPage(grid) {
  const { filter } = grid.dataset;
  const limit = Number(grid.dataset.limit);
  let posts = await getPosts(filter, limit);
  const loadMoreThreshold = limit > 0 && limit < pageSize ? limit : pageSize;
  while (posts.length < loadMoreThreshold && !window.keysight.postData.allLoaded) {
    // eslint-disable-next-line no-await-in-loop
    await loadPosts(true);
    // eslint-disable-next-line no-await-in-loop
    posts = await getPosts(filter, limit);
  }
  let counter = Number(grid.dataset.loadedCount);
  const navPages = getNavPages();
  for (let i = 0;
    counter < posts.length && i < pageSize && (limit < 0 || counter < limit);
    i += 1) {
    const postCard = buildPostCard(posts[counter], counter, navPages);
    grid.append(postCard);
    counter += 1;
  }
  grid.dataset.loadedCount = counter;

  // if we get within 50 of the end, load more
  if ((counter + 50) >= posts.length) {
    await loadPosts(true);
  }
}

function showPage(grid) {
  for (let i = 0; i < pageSize; i += 1) {
    const post = grid.querySelector('.post-card.hidden');
    if (post) {
      post.classList.remove('hidden');
    }
  }
}

async function loadBlock(block) {
  const grid = block.querySelector('.post-cards-grid');
  const moreContainer = block.querySelector('.show-more-cards-container');

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
      loadBlock(block);
    }
  });
  // const section = block.closest('.section');
  // const observationElement = section && section.previousElementSibling
  //   ? section.previousElementSibling : block;
  observer.observe(block);
}
