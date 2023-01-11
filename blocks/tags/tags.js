import {
  getPosts,
  createElement,
  addOutsideClickListener,
  splitTags,
} from '../../scripts/scripts.js';
import { decorateIcons, readBlockConfig } from '../../scripts/lib-franklin.js';

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

function getTagsLinks(tags) {
  const list = createElement('ul', 'tags-list');
  tags.forEach((tag) => {
    const item = createElement('li');
    const link = createElement('a');
    link.innerHTML = `<span class="tag-name">#${tag.tag}</span><span class="tag-count">${tag.count}</span>`;
    link.href = `/tag-matches?tag=${encodeURIComponent(tag.tag)}`;

    item.append(link);
    list.append(item);
  });

  return list;
}

/**
 * decorates the block
 * @param {Element} block The featured posts block element
 */
export default async function decorate(block) {
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
  block.innerHTML = '';
  block.append(getTagsLinks(tagsAsArray));
  if (block.classList.contains('all')) {
    block.prepend(buildSearch(block));
  }
  decorateIcons(block);
}
