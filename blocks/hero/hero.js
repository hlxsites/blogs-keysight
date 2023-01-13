/**
 * decorates the hero
 * @param {Element} block The hero block element
 */
export default async function decorate(block) {
  const textElems = block.querySelectorAll('h1, p');
  const wrapper = block.closest('.hero-wrapper');
  if (textElems && textElems.length > 0) {
    wrapper.classList.add('hero-full');
    // change pics to lossless
    block.querySelectorAll('picture > source[type="image/webp"]').forEach((source) => {
      const srcset = source.getAttribute('srcset');
      source.setAttribute('srcset', srcset.replace('format=webply', 'format=webpl;'));
    });
    if (textElems.length === 1) {
      wrapper.classList.add('hero-text-full');
    } else {
      wrapper.classList.add('hero-text-contained');
    }
  } else {
    wrapper.classList.add('hero-contained');
  }
}
