import ffetch from '../../scripts/ffetch.js';
import { getMetadataJson } from '../../scripts/scripts.js';
import { createOptimizedPicture, getMetadata } from '../../scripts/lib-franklin.js';

function buildPost(isPlaceholder, entry) {
  return `
    <a href="${entry.link}" title="${isPlaceholder ? '' : entry.title}">
      ${isPlaceholder ? '<div class="picture-placeholder"></div>' : ''}
      ${!isPlaceholder && entry.pic ? entry.pic.outerHTML : ''}
    </a>
    <div>
      <p class="category">${entry.category}</p>
      <a href="${entry.link}">${isPlaceholder ? '' : entry.title}</a>
    </div>
  `;
}

/**
 * decorates the block
 * @param {Element} block The featured posts block element
 */
export default async function decorate(block) {
  const indexUrl = new URL('/blogs/query-index.json', window.location.origin);
  const postsGrid = block.querySelector('div');
  postsGrid.classList.add('featured-posts-grid');

  [...postsGrid.children].forEach((post) => {
    post.classList.add('post', 'post-placeholder');

    const heading = post.querySelector('p > strong');
    const link = post.querySelector('p > a');
    const entryPlaceholder = {
      link: link.href,
      category: heading.textContent,
    };

    post.innerHTML = buildPost(true, entryPlaceholder);
    post.id = `blogs_${heading.textContent.toLowerCase().replace(' ', '_')}`;

    // small delay to get to lcp faster
    setTimeout(async () => {
      if (link.title !== 'auto') {
        getMetadataJson(`${link.href}`).then((meta) => {
          const imageDefault = meta['og:image'];
          const titleDefault = meta['og:title'];
          const entryForDefault = {
            ...entryPlaceholder,
            title: titleDefault,
            pic: imageDefault && createOptimizedPicture(imageDefault, '', false, [{ width: '200' }]),
          };

          post.innerHTML = buildPost(false, entryForDefault);
          post.classList.remove('post-placeholder');
        });
      } else {
        const topic = getMetadata('topic');
        const subTopic = getMetadata('subtopic');
        const mostRecentPost = await ffetch(indexUrl.href)
          .filter((postData) => {
            if (!topic) {
            // no topic so just get the first one
              return true;
            }

            if (topic === postData.topic) {
              if (subTopic) {
                return subTopic === postData.subtopic;
              }
              // topic match but no subtopic
              return true;
            }
            return false;
          }).first();

        if (mostRecentPost) {
          if (mostRecentPost.image.includes('/default-meta-image')) {
            mostRecentPost.image = '/blogs/generic-post-image.jpg?width=1200&format=pjpg&optimize=medium';
          }
          const entryForAuto = {
            ...entryPlaceholder,
            title: mostRecentPost.title,
            link: mostRecentPost.path,
            pic: createOptimizedPicture(mostRecentPost.image, '', false, [{ width: '200' }]),
          };

          post.innerHTML = buildPost(false, entryForAuto);
          post.classList.remove('post-placeholder');
        } else {
          post.remove();
        }
      }
    }, 250);
  });
}
