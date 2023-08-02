export default function decorate(block) {
  [...block.firstElementChild.children].forEach((col) => {
    const pic = col.querySelector('picture');
    if (pic) {
      block.classList.add('cta-has-image');
      col.classList.add('cta-img-container');
    } else {
      col.classList.add('cta-text-container');
    }
  });
}
