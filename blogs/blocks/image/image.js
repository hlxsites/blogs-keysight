export default async function decorate(block) {
  const pic = block.querySelector('picture');
  const container = pic.closest('div');
  container.classList.add('container');

  block.querySelectorAll('a.button').forEach((button) => button.classList.remove('button'));
}
