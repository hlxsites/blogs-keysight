/**
 * decorates the hero
 * @param {Element} block The hero block element
 */
export default async function decorate(block) {
  const textElems = block.querySelectorAll('h1, p');
  const wrapper = block.closest('.hero-wrapper');

  block.querySelector('img').setAttribute('loading', 'eager');

  if (textElems && textElems.length > 0) {
    wrapper.classList.add('hero-full');
    if (textElems.length === 1) {
      wrapper.classList.add('hero-text-full');
    } else {
      wrapper.classList.add('hero-text-contained');
      block.id = 'BannerBlog';
    }
  } else {
    wrapper.classList.add('hero-contained');
  }
}
