/*
 * Video Block
 * Show a video referenced by a link
 * https://www.hlx.live/developer/block-collection/video
 */

export default async function decorate(block) {
  const a = block.querySelector('a');
  if (a) {
    const source = a.href;
    const pic = block.querySelector('picture');
    if (pic) {
      const wrapper = document.createElement('div');
      wrapper.className = 'video-placeholder';
      wrapper.innerHTML = '<div class="video-placeholder-play"><button title="Play"></button></div>';
      wrapper.prepend(pic);
      wrapper.addEventListener('click', () => {
        block.innerHTML = `
        <video controls autoplay>
          <source src="${source}" type="video/${source.split('.').pop()}" >
        </video>
        `;
      });
      block.innerHTML = '';
      block.append(wrapper);
    } else {
      block.innerHTML = `
      <video controls>
        <source src="${source}" type="video/${source.split('.').pop()}" >
      </video>
      `;
    }
  }
}
