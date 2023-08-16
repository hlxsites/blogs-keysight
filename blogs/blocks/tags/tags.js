import {
  createElement,
  addOutsideClickListener,
  splitTags,
  getPostsFfetch,
  filterPosts,
  getPageTag,
} from '../../scripts/scripts.js';
import { validateHashTags } from '../../scripts/taxonomy.js';
import { getOrigin, readBlockConfig } from '../../scripts/lib-franklin.js';

function buildSearch(block) {
  const wrapper = createElement('div', 'find-tag');
  const input = createElement('input', 'find-tag-text', {
    type: 'text',
    placeholder: 'Find a Tag',
    autocomplete: 'off',
  });
  const ul = createElement('ul', 'found-tags');

  input.addEventListener('keyup', () => {
    ul.innerHTML = '';
    const val = input.value;
    if (val.length > 2) {
      const matchedTags = [...block.querySelectorAll('.tags-list .tag-name')].filter((tagSpan) => {
        const tag = tagSpan.innerText.replace('#', '');
        return tag.toLowerCase().includes(val.toLowerCase());
      });
      ul.append(...matchedTags.map((tagSpan) => {
        const li = createElement('li');
        const tagText = tagSpan.innerText.replace('#', '');
        li.innerHTML = `<a href="/blogs/tag-matches?tag=${encodeURIComponent(tagText)}">${tagText}</a>`;
        return li;
      }));
      addOutsideClickListener(ul, () => {
        ul.innerHTML = '';
      });
    }
  });

  wrapper.append(input);
  wrapper.append(ul);

  return wrapper;
}

async function getTagsLinks(tags, limit) {
  const list = createElement('ul', 'tags-list');
  tags.slice(0, limit).forEach((tag) => {
    const item = createElement('li');
    const link = createElement('a');
    link.innerHTML = `<span class="tag-name">#${tag.tag.TAG_TITLE}</span><span class="tag-count">${tag.count}</span>`;
    link.href = `/blogs/tag-matches?tag=${encodeURIComponent(tag.tag.TAG_TITLE)}`;
    item.append(link);
    list.append(item);
  });
  return list;
}

async function loadTags(block, isAll) {
  const conf = readBlockConfig(block);
  const { filter } = conf;

  const applicableFilter = filter || 'auto';
  const pageTag = await getPageTag();
  let postsGenerator = getPostsFfetch().filter(filterPosts(applicableFilter, pageTag));
  let posts;
  if (isAll) {
    posts = await postsGenerator.all();
  } else {
    // 14 = 2x 7
    // 7 is page size of post cards grid, and by default it loads the first 2 pages
    // so this will look at number of posts loaded by post cards without having to load any extra
    postsGenerator = postsGenerator.slice(0, 14);
    posts = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const post of postsGenerator) {
      posts.push(post);
    }
  }

  const tags = {};
  await Promise.all(posts.map(async (post) => {
    const postTags = splitTags(post.tags);
    // todo tagging use of tagPath
    const [validTags] = await validateHashTags(postTags);
    if (validTags.length > 0) {
      validTags.forEach((tag) => {
        let tagObj = tags[tag.TAG_PATH];
        if (!tagObj) {
          tagObj = {
            count: 0,
            tag,
          };
        }
        tagObj.count += 1;
        tags[tag.TAG_PATH] = tagObj;
      });
    }
  }));
  const tagsAsArray = Object.values(tags).filter((tagObj) => {
    const url = new URL(window.location);
    const params = url.searchParams;
    const tagPath = params.get('tag');
    if (tagPath) {
      // hide current tag when on a tag page
      return tagPath !== tagObj.tag.TAG_PATH;
    }
    return true;
  });
  tagsAsArray.sort((a, b) => b.count - a.count);
  block.innerHTML = '';
  block.append(await getTagsLinks(tagsAsArray, isAll ? -1 : 15));
  if (isAll) {
    block.prepend(buildSearch(block));
  }
}

/**
 * decorates the block
 * @param {Element} block The featured posts block element
 */
export default async function decorate(block) {
  block.closest('.section').id = 'blogs_related_tags';
  const isAll = block.classList.contains('all');
  const postCards = document.querySelector('.block.post-cards');
  if (!postCards || postCards.dataset.postsLoaded === 'true') {
    loadTags(block, isAll);
  } else {
    /*
      The posts, which are used to derive the tags, are a shared array
      This helps avoid timing conflicts, such that if there are post cards in the page
      we wait til that finishes loading, which may require loading additional posts from
      the query index to the shared array.

      Once that completes, this block can simply collect tags from the posts already loaded
      rather than potentially having to load more posts on it's own to find all the required tags.
      We do this by listening for a message from the post cards block, which triggers the loading.

      Note also the check above on postCards.dataset.postsLoaded. That is required to avoid
      a case where the posts finish loading before this block loads, in which case the
      message would never be received.
    */
    window.addEventListener('message', (msg) => {
      if (msg.origin === getOrigin() && msg.data && msg.data.postCardsLoaded) {
        loadTags(block, isAll);
      }
    });
  }
}
