import {
  createOptimizedPicture,
  buildBlock,
  decorateBlock,
  loadBlock,
} from '../../scripts/lib-franklin.js';
import {
  splitTags,
  createElement,
  getPostsFfetch,
} from '../../scripts/scripts.js';
import ffetch from '../../scripts/ffetch.js';
import { validateTags } from '../../scripts/taxonomy.js';

const pageSize = 10;
const initLoad = pageSize * 2;

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
    const validTags = await validateTags(tags);
    const list = createElement('ul', 'card-tags');
    validTags[0].forEach((tag) => {
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

function executeSearch(q) {
  const posts = getPostsFfetch();
  const terms = q.toLowerCase().split(' ').map((e) => e.trim()).filter((e) => !!e);
  const stopWords = ['a', 'an', 'the', 'and', 'to', 'for', 'i', 'of', 'on', 'into'];
  const results = posts.filter((post) => {
    const title = post.title.toLowerCase();
    const text = [post.description, post.author].join(' ').toLowerCase();
    const tags = splitTags(post.tags).join(' ').toLowerCase();

    let matchesQuery = false;
    terms.forEach((term) => {
      if (!stopWords.includes(term)) {
        const regex = new RegExp(term, 'g');
        matchesQuery = title.match(regex) || text.match(regex) || tags.match(regex);
      }
    });

    return matchesQuery;
  });

  return results;
}

async function buildPostCard(post, index) {
  const classes = ['post-card'];
  if (index >= pageSize) {
    classes.push('hidden');
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

  const picMedia = [{ width: '400' }];
  const pic = createOptimizedPicture(post.image, '', false, picMedia);
  postCard.innerHTML = `
    <a class="post-card-image" title="${post.title.replaceAll('"', '')}" href="${post.path}">${pic.outerHTML}</a>
    <div class="post-card-text">
      <p class="card-title"><a href="${post.path}">${post.title}</a></p>
      <p class="card-author"><span class="author-text">${post.author}</span><span class="card-date">${postDateStr}</span></p>
    </div>
  `;

  const authorLinkPromise = getAuthorLink(post);
  authorLinkPromise.then((authorLink) => {
    if (authorLink) {
      postCard.querySelector('.card-author').replaceChild(authorLink, postCard.querySelector('.card-author .author-text'));
    }
  });

  const tagsLinks = await getTagsLinks(post);
  if (tagsLinks) {
    postCard.querySelector('.post-card-text').append(tagsLinks);
  }

  return postCard;
}

export default async function decorate(block) {
  const url = new URL(window.location);
  const params = url.searchParams;
  const q = params.get('q').toLowerCase();

  const initResults = executeSearch(q).slice(0, initLoad);
  const deferredPosts = executeSearch(q).slice(initLoad);
  const grid = createElement('div', 'post-cards-grid');

  let counter = 0;
  // eslint-disable-next-line no-restricted-syntax
  for await (const post of initResults) {
    const postCard = buildPostCard(post, counter);
    grid.append(postCard);
    counter += 1;
  }

  let resultsLength;
  if (counter === initLoad) {
    resultsLength = `${counter}+`;
  } else {
    resultsLength = `${counter}`;
  }

  // let primaryPosts;
  // let deferredPosts;
  // if (results.length > initLoad) {
  //   primaryPosts = results.slice(0, initLoad);
  //   deferredPosts = results.slice(initLoad);
  // } else {
  //   primaryPosts = results;
  //   deferredPosts = [];
  // }

  // let counter = 0;
  // for (let i = 0; i < primaryPosts.length; i += 1) {
  //   const postCard = buildPostCard(primaryPosts[i].post, counter);
  //   grid.append(postCard);
  //   counter += 1;
  // }

  let deferredLoaded = false;
  const loadDeferred = async () => {
    if (!deferredLoaded) {
      deferredLoaded = true;
      // eslint-disable-next-line no-restricted-syntax
      for await (const post of deferredPosts) {
        const postCard = buildPostCard(post, counter);
        grid.append(postCard);
        counter += 1;
      }

      block.querySelector('.results-count').textContent = `${counter} Results`;
    }
  };

  block.innerHTML = '';

  const resultCount = createElement('h2');
  resultCount.textContent = `${resultsLength} Results`;
  resultCount.classList.add('results-count');
  block.append(resultCount);

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
      setTimeout(async () => {
        if (!deferredLoaded) {
          await loadDeferred();
        }

        hasHidden = grid.querySelector('.post-card.hidden');
        if (!hasHidden) {
          // no more hidden, so hide show more button
          moreButton.style.display = 'none';
        }
      }, 250);
    });

    const moreContainer = createElement('div', 'show-more-cards-container');
    moreContainer.append(moreButton);

    block.append(moreContainer);
  }
  const section = block.closest('.section');
  const searchFormSection = createElement('div', 'section');
  const searchForm = buildBlock('search-form', '');
  searchFormSection.append(searchForm);
  decorateBlock(searchForm);
  await loadBlock(searchForm);
  section.insertAdjacentElement('beforebegin', searchFormSection);
}
