import {
  getPosts,
  createElement,
  addOutsideClickListener,
  splitTags,
  loadPosts,
  execDeferred,
} from '../../scripts/scripts.js';
import { readBlockConfig } from '../../scripts/lib-franklin.js';

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
        li.innerHTML = `<a href="/tag-matches?tag=${encodeURIComponent(tagText)}">${tagText}</a>`;
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

function getTagsLinks(tags, limit) {
  const list = createElement('ul', 'tags-list');
  tags.slice(0, limit > 0 ? limit : tags.length).forEach((tag) => {
    const item = createElement('li');
    const link = createElement('a');
    link.innerHTML = `<span class="tag-name">#${tag.tag}</span><span class="tag-count">${tag.count}</span>`;
    link.href = `/tag-matches?tag=${encodeURIComponent(tag.tag)}`;

    item.append(link);
    list.append(item);
  });

  return list;
}

async function loadBlock(block) {
  const conf = readBlockConfig(block);
  const { filter } = conf;

  const applicableFilter = filter || 'auto';
  const posts = await getPosts(applicableFilter, -1);
  const tags = {};
  posts.forEach((post) => {
    const postTags = splitTags(post.tags);
    if (postTags.length > 0) {
      postTags.forEach((tag) => {
        let tagObj = tags[tag];
        if (!tagObj) {
          tagObj = {
            count: 0,
            tag,
          };
        }
        tagObj.count += 1;
        tags[tag] = tagObj;
      });
    }
  });
  const tagsAsArray = Object.values(tags).map((tagObj) => tagObj).filter((tagObj) => {
    const url = new URL(window.location);
    const params = url.searchParams;
    const tag = params.get('tag');
    if (tag) {
      // hide current tag when on a tag page
      return tag !== tagObj.tag;
    }
    return true;
  });
  tagsAsArray.sort((a, b) => b.count - a.count);
  const isAll = block.classList.contains('all');
  block.innerHTML = '';
  block.append(getTagsLinks(tagsAsArray, isAll ? -1 : 15));
  if (isAll) {
    block.prepend(buildSearch(block));
  }
}

/**
 * decorates the block
 * @param {Element} block The featured posts block element
 */
export default async function decorate(block) {
  const isAll = block.classList.contains('all');
  if (isAll) {
    // if it's all tags, force load all the posts then use those to collect the tags
    while (!window.keysight.postData.allLoaded) {
      // eslint-disable-next-line no-await-in-loop
      await loadPosts(true);
    }
    loadBlock(block);
  } else {
    // find a post cards block, if it exists wait to load tags til that loads, else just load
    const postCards = document.querySelector('.block.post-cards');
    if (postCards) {
      /*
        The posts, which are used to derive the tags, are a shared array
        This helps avoid timing conflict, such that if there are post cards in the page
        we wait til that finishes loading, which may require loading additional posts from
        the query index.

        Once that completes, this block can simply collect tags from the posts already loaded
        rather than potentially having to load more posts on it's own to find all the required tags.
      */

      let loaded = false;
      window.addEventListener('message', (msg) => {
        if (msg.origin === window.location.origin && msg.data && msg.data.postCardsLoaded) {
          loaded = true;
          loadBlock(block);
        }
      });
      execDeferred(() => {
        // in some cases, this block doesn't load til after the post cards sends it's message
        // so this handles that by executing the loading on a deferred timout
        // this feels hacky, should consider if there are better ways to do this
        if (!loaded) {
          loadBlock(block);
        }
      });
    } else {
      loadBlock(block);
    }
  }
}
