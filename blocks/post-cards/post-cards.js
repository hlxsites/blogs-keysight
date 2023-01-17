import {
  getPosts,
  createElement,
  loadPosts,
  splitTags,
} from '../../scripts/scripts.js';
import { createOptimizedPicture, readBlockConfig, decorateIcons } from '../../scripts/lib-franklin.js';

const pageSize = 7;
/*
async function getTopicLink(post) {
  const { topic, subtopic } = post;
  let topicText = topic;
  if (subtopic && subtopic !== '0') {
    topicText = subtopic;
  }

  const notLink = createElement('span');
  notLink.innerText = topicText;

  try {
    const topicPage = await findPage((page) => {
      const isPost = page.template === 'post';
      if (!isPost) {
        return page.topic === topic && page.subtopic === subtopic;
      }
      return false;
    });
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

async function getAuthorLink(post) {
  const { author } = post;
  const notLink = createElement('span');
  notLink.innerText = `${author}`;

  try {
    const authorPage = await findPage((page) => page.title === author);
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
*/
function getTagsLinks(post) {
  const tags = splitTags(post.tags);
  if (tags.length > 0) {
    const list = createElement('ul', 'card-tags');
    tags.forEach((tag) => {
      const item = createElement('li');
      const link = createElement('a');
      link.innerText = `#${tag}`;
      link.href = `/tag-matches?tag=${encodeURIComponent(tag)}`;

      item.append(link);
      list.append(item);
    });

    return list;
  }

  return undefined;
}

function buildPostCard(post, index) {
  const classes = ['post-card', 'hidden'];
  if (index % 7 === 3) {
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
  /*
  getTopicLink(post).then((link) => {
    postCard.querySelector('.card-topic')
    .replaceChild(link, postCard.querySelector('.card-topic .topic-text'));
  });
  getAuthorLink(post).then((link) => {
    postCard.querySelector('.card-author')
    .replaceChild(link, postCard.querySelector('.card-author .author-text'));
  });
  */
  const tagsLinks = getTagsLinks(post);
  if (tagsLinks) {
    postCard.querySelector('.post-card-text').append(tagsLinks);
  }

  decorateIcons(postCard);
  return postCard;
}

async function loadPage(grid, moreButtonContainer) {
  const { filter } = grid.dataset;
  const limit = Number(grid.dataset.limit);
  const posts = await getPosts(filter, limit);
  let counter = Number(grid.dataset.loadedCount);
  for (let i = 0;
    counter < posts.length && i < pageSize && (limit < 0 || counter < limit);
    i += 1) {
    const postCard = buildPostCard(posts[counter], counter);
    grid.append(postCard);
    counter += 1;
  }
  grid.dataset.loadedCount = counter;

  // if we get within 50 of the end, load more
  if ((counter + 50) >= posts.length) {
    await loadPosts(true);
  }

  const hidden = grid.querySelector('.post-card.hidden');
  if (!hidden) {
    moreButtonContainer.style.display = 'none';
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

/**
 * decorates the block
 * @param {Element} block The featured posts block element
 */
export default async function decorate(block) {
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
  moreButton.addEventListener('click', () => {
    showPage(grid);
    loadPage(grid, moreContainer);
  });

  block.innerHTML = '';

  // load the first 2 pages, show 1
  await loadPage(grid, moreContainer);
  await loadPage(grid, moreContainer);
  showPage(grid);

  block.append(grid);
  block.append(moreContainer);
}
