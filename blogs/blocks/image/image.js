export default async function decorate(block) {
  const pic = block.querySelector('picture');
  const container = pic.parentElement;
  container.classList.add('container');
}
