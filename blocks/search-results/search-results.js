import {
  createOptimizedPicture,
  buildBlock,
  decorateBlock,
  loadBlock,
} from '../../scripts/lib-franklin.js';
import {
  getPosts,
  splitTags,
  createElement,
  getNavPages,
} from '../../scripts/scripts.js';

const pageSize = 10;
const initLoad = pageSize * 2;

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
      link.href = `/tag-matches?tag=${encodeURIComponent(tag)}`;

      item.append(link);
      list.append(item);
    });

    return list;
  }

  return undefined;
}

async function executeSearch(q) {
  const posts = await getPosts('none', -1);
  const results = posts.map((post) => {
    let score = 0;
    score += post.title.toLowerCase().includes(q) ? 10 : 0;
    score += post.description.toLowerCase().includes(q) ? 5 : 0;
    score += post.author.toLowerCase().includes(q) ? 2 : 0;
    const tags = splitTags(post.tags);
    tags.forEach((tag) => {
      score += tag.toLowerCase().includes(q) ? 5 : 0;
    });
    return {
      post,
      score,
    };
  }).filter((postObj) => postObj.score > 0)
    .sort((postA, postB) => postB.score - postA.score);

  return results;
}

function buildPostCard(post, index, navPagesPromise) {
  const classes = ['post-card'];
  if (index >= pageSize) {
    classes.push('hidden');
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

  const picMedia = [{ width: '400' }];
  const pic = createOptimizedPicture(post.image, '', false, picMedia);
  postCard.innerHTML = `
    <a class="post-card-image" title="${post.title.replaceAll('"', '')}" href="${post.path}">${pic.outerHTML}</a>
    <div class="post-card-text">
      <p class="card-title"><a href="${post.path}">${post.title}</a></p>
      <p class="card-author"><span class="author-text">${post.author}</span><span class="card-date">${postDateStr}</span></p>
    </div>
  `;
  navPagesPromise.then((navPages) => {
    const authorLink = getAuthorLink(post, navPages);
    if (authorLink) {
      postCard.querySelector('.card-author').replaceChild(authorLink, postCard.querySelector('.card-author .author-text'));
    }
  });

  const tagsLinks = getTagsLinks(post);
  if (tagsLinks) {
    postCard.querySelector('.post-card-text').append(tagsLinks);
  }

  // decorateIcons(postCard);
  return postCard;
}

export default async function decorate(block) {
  const url = new URL(window.location);
  const params = url.searchParams;
  const q = params.get('q').toLowerCase();

  const results = await executeSearch(q);
  const grid = createElement('div', 'post-cards-grid');
  let primaryPosts;
  let deferredPosts;
  if (results.length > initLoad) {
    primaryPosts = results.slice(0, initLoad);
    deferredPosts = results.slice(initLoad);
  } else {
    primaryPosts = results;
    deferredPosts = [];
  }

  let counter = 0;
  const navPagesPromise = getNavPages();
  for (let i = 0; i < primaryPosts.length; i += 1) {
    const postCard = buildPostCard(primaryPosts[i].post, counter, navPagesPromise);
    grid.append(postCard);
    counter += 1;
  }

  let deferredLoaded = false;
  const loadDeferred = () => {
    if (!deferredLoaded) {
      deferredLoaded = true;
      for (let i = 0; i < deferredPosts.length; i += 1) {
        const postCard = buildPostCard(deferredPosts[i].post, counter, navPagesPromise);
        grid.append(postCard);
        counter += 1;
      }
    }
  };

  block.innerHTML = '';

  const resultCount = createElement('h2');
  resultCount.textContent = `${results.length} Results`;
  resultCount.classList.add('results-count');
  block.append(resultCount);

  block.append(grid);

  let hasHidden = grid.querySelector('.post-card.hidden');
  if (hasHidden) {
    const moreButton = createElement('button', 'show-more-cards');
    moreButton.innerText = 'Show More';
    moreButton.addEventListener('click', () => {
      if (!deferredLoaded) {
        loadDeferred();
      }

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

    const section = block.closest('.section');
    const searchFormSection = createElement('div', 'section');
    const searchForm = buildBlock('search-form', '');
    searchFormSection.append(searchForm);
    decorateBlock(searchForm);
    await loadBlock(searchForm);
    section.insertAdjacentElement('beforebegin', searchFormSection);
  }
}
