import { getPosts } from '../../scripts/scripts.js';
import { createOptimizedPicture } from '../../scripts/lib-franklin.js';
/**
 * decorates the block
 * @param {Element} block The featured posts block element
 */
export default async function decorate(block) {
  const postsGrid = block.querySelector('div');
  postsGrid.classList.add('featured-posts-grid');

  const pages = await getPosts();

  [...postsGrid.children].forEach((post) => {
    post.classList.add('post');

    const heading = post.querySelector('p > strong');
    const link = post.querySelector('p > a');
    let pageForLink = pages.find((page) => page.path === new URL(link.href).pathname);
    if (!pageForLink) {
      [pageForLink] = pages;
    }

    if (pageForLink) {
      const pic = createOptimizedPicture(pageForLink.image);
      post.innerHTML = `
        <a href="${pageForLink.path}">${pic.outerHTML}</a>
        <div>
          <p class="category">${heading.textContent}</p>
          <a href="${pageForLink.path}">${pageForLink.title}</a>
        </div>
      `;
    } else {
      post.remove();
    }
  });
}
