import {
  getPosts,
  createElement,
  execDeferred,
  getPages,
} from '../../scripts/scripts.js';
import { createOptimizedPicture, readBlockConfig, decorateIcons } from '../../scripts/lib-franklin.js';

const pageSize = 7;
const initLoad = pageSize * 10;

async function getTopicLink(post) {
  const { topic, subtopic } = post;
  const topicText = subtopic || topic;

  const notLink = createElement('span');
  notLink.innerText = topicText;

  try {
    const pages = await getPages();

    const topicPage = pages.find((page) => {
      const isPost = page.author !== undefined && page.author !== '';
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
    // no op, just fall through to retunr default
  }

  return notLink;
}

async function getAuthorLink(post) {
  const { author } = post;
  const notLink = createElement('span');
  notLink.innerText = `${author}`;

  try {
    const pages = await getPages();

    const authorPage = pages.find((page) => page.title === author);
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
  if (post.tags) {
    const list = createElement('ul', 'card-tags');
    post.tags.split(',').forEach((tag) => {
      const item = createElement('li');
      const link = createElement('a');
      link.innerText = tag;
      link.href = `/tag-matches?tag=${encodeURIComponent(tag)}`;

      item.append(link);
      list.append(item);
    });

    return list;
  }

  return undefined;
}

function buildPostCard(post, index) {
  const classes = ['post-card'];
  if (index >= pageSize) {
    classes.push('hidden');
  }
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

  let picMedia = [{ media: '(min-width: 600px)', width: '450' }, { media: '(min-width: 900px)', width: '400' }, { width: '600' }];
  if (classes.includes('featured')) {
    picMedia = [{ media: '(min-width: 600px)', width: '450' }, { media: '(min-width: 900px)', width: '800' }, { width: '600' }];
  }
  const pic = createOptimizedPicture(post.image, '', false, picMedia);
  postCard.innerHTML = `
    <a class="post-card-image" href="${post.path}">${pic.outerHTML}</a>
    <div class="post-card-text">
      <p class="card-topic"></p>
      <p class="card-title"><a href="${post.path}">${post.title}</a></p>
      <p class="card-author"><span class="card-date">${postDateStr}</span></p>
      <p class="card-description">${post.description}</p>
      <p class="card-read"><span class="icon icon-clock"></span>${post.readtime}</p>
    </div>
  `;
  getTopicLink(post).then((link) => {
    postCard.querySelector('.card-topic').append(link);
  });
  getAuthorLink(post).then((link) => {
    postCard.querySelector('.card-author').prepend(link);
  });
  const tagsLinks = getTagsLinks(post);
  if (tagsLinks) {
    postCard.querySelector('.post-card-text').append(tagsLinks);
  }

  decorateIcons(postCard);
  return postCard;
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
  const posts = await getPosts(applicableFilter, limit);
  const grid = createElement('div', 'post-cards-grid');
  let primaryPosts;
  let deferredPosts;
  if (posts.length > initLoad) {
    primaryPosts = posts.slice(0, initLoad);
    deferredPosts = posts.slice(initLoad);
  } else {
    primaryPosts = posts;
    deferredPosts = [];
  }

  let counter = 0;
  for (let i = 0; i < primaryPosts.length && (limitNumber < 0 || i < limitNumber); i += 1) {
    const postCard = buildPostCard(primaryPosts[i], counter);
    grid.append(postCard);
    counter += 1;
  }

  // there are potentially hundreds of posts, so to make this load faster in those scenarios
  // we defer building the dom for posts after the first few pages
  execDeferred(() => {
    for (let i = 0; i < deferredPosts.length && (limitNumber < 0 || i < limitNumber); i += 1) {
      const postCard = buildPostCard(deferredPosts[i], counter);
      grid.append(postCard);
      counter += 1;
    }
  });

  block.innerHTML = '';
  block.append(grid);

  let hasHidden = grid.querySelector('.post-card.hidden');
  if (hasHidden) {
    const moreButton = createElement('button', 'show-more-cards');
    moreButton.innerText = 'Show More';
    moreButton.addEventListener('click', () => {
      for (let i = 0; i < pageSize; i += 1) {
        const nextPost = grid.querySelector('.post-card.hidden');
        if (nextPost) {
          nextPost.classList.remove('hidden');
        }
      }
      hasHidden = grid.querySelector('.post-card.hidden');
      if (!hasHidden) {
        // no more hidden, so hide show more button
        moreButton.style.display = 'none';
      }
    });

    const moreContainer = createElement('div', 'show-more-cards-container');
    moreContainer.append(moreButton);

    block.append(moreContainer);
  }
}
