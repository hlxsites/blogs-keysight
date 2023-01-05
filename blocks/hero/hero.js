/**
 * decorates the hero
 * @param {Element} block The hero block element
 */
export default async function decorate(block) {
  const textElems = block.querySelectorAll('h1, p');
  if (textElems && textElems.length > 0) {
    block.closest('.hero-wrapper').classList.add('hero-full');
  } else {
    block.closest('.hero-wrapper').classList.add('hero-contained');
  }
}
