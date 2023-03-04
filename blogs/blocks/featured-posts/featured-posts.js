import { getPosts, execDeferred, loadPosts } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';

async function findPageForPost(postUrl) {
  let pages = await getPosts('none', -1);
  let pageForLink = pages.find((page) => page.path === new URL(postUrl).pathname);
  while (!pageForLink && !window.keysight.postData.allLoaded) {
    // eslint-disable-next-line no-await-in-loop
    await loadPosts(true);
    // eslint-disable-next-line no-await-in-loop
    pages = await getPosts('none', -1);

    pageForLink = pages.find((page) => page.path === new URL(postUrl).pathname);
  }

  return pageForLink;
}

/**
 * decorates the block
 * @param {Element} block The featured posts block element
 */
export default async function decorate(block) {
  const postsGrid = block.querySelector('div');
  postsGrid.classList.add('featured-posts-grid');

  const featuredPosts = [...postsGrid.children].map((post) => {
    post.classList.add('post', 'post-placeholder');

    const heading = post.querySelector('p > strong');
    const link = post.querySelector('p > a');

    post.innerHTML = `
        <a href="#"><div class="picture-placeholder"></div></a>
        <div>
          <p class="category">${heading.textContent}</p>
          <a href="#"></a>
        </div>
    `;

    return {
      title: heading.textContent,
      url: link.href,
    };
  });

  execDeferred(async () => {
    for (let i = 0; i < featuredPosts.length; i += 1) {
      const post = featuredPosts[i];
      // eslint-disable-next-line no-await-in-loop
      const pageForPost = await findPageForPost(post.url);
      post.page = pageForPost;
    }

    const filteredPages = await getPosts('auto', -1);

    let notFoundCounter = 0;
    featuredPosts.forEach((post) => {
      const postElem = block.querySelector('.post-placeholder');
      if (!post.page) {
        /*
           in most normal cases this should only happen for the "most recent" section
          so we are just getting the first post
          in the scenarion that a different post isn't linked properly or is somehow not found
          the counter guarantees that different posts get highlighted
          instead of showing the most recent post multiple times
          we also use the filtered pages here
          to ensure the link comes from the right section of the site
        */
        post.page = filteredPages[notFoundCounter];
        notFoundCounter += 1;
      }

      if (post.page) {
        const pic = createOptimizedPicture(post.page.image, '', false, [{ width: '200' }]);
        postElem.innerHTML = `
        <a href="${post.page.path}" title="${post.page.title.replaceAll('"', '')}">${pic.outerHTML}</a>
        <div>
          <p class="category">${post.title}</p>
          <a href="${post.page.path}">${post.page.title}</a>
        </div>
      `;
        postElem.classList.remove('post-placeholder');
      } else {
        postElem.remove();
      }
    });
  });
}
