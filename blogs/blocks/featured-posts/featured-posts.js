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

async function createFeaturedPosts(mailEl, allPosts) {
  const postsGrid = mailEl.querySelector('div');
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
    setTimeout(() => {
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
      } else if (allPosts.length >= 1) {
        const topic = getMetadata('topic');
        const subTopic = getMetadata('subtopic');
        const mostRecentPost = allPosts.find((postData) => {
          if (postData.robots.indexOf('noindex') > -1) {
            return false;
          }

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
        });
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

async function getPosts() {
  const indexUrl = new URL('query-index.json', window.location.href);
  const posts = ffetch(indexUrl).limit(100).all();
  return posts;
}

/**
 * decorates the block
 * @param {Element} block The featured posts block element
 */
export default async function decorate(block) {
  const allPosts = await getPosts();
  createFeaturedPosts(block, allPosts);
}
