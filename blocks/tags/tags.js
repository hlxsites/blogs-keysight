import { getPosts, createElement } from '../../scripts/scripts.js';
import { readBlockConfig } from '../../scripts/lib-franklin.js';

function getTagsLinks(tags) {
  const list = createElement('ul', '', 'tags-list');
  tags.forEach((tag) => {
    const item = createElement('li');
    const link = createElement('a');
    link.innerText = tag.tag;
    link.href = `/tag-matches?tag=${encodeURIComponent(tag)}`;

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
    const postTags = post.tags;
    if (postTags) {
      postTags.split(',').forEach((tag) => {
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
  const tagsAsArray = Object.values(tags).map((tagObj) => tagObj);
  tagsAsArray.sort((a, b) => b.count - a.count);
  block.innerHTML = '';
  block.append(getTagsLinks(tagsAsArray));
}
