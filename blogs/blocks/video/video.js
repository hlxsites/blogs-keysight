/*
 * Video Block
 * Show a video referenced by a link
 * https://www.hlx.live/developer/block-collection/video
 */

export default async function decorate(block) {
  const a = block.querySelector('a');
  if (a) {
    const url = new URL(a.href);
    url.searchParams.forEach((value, key) => {
      url.searchParams.delete(key);
    });
    const source = url.toString();
    block.innerHTML = `
    <video controls>
      <source src="${source}" type="video/${source.split('.').pop()}" >
    </video>
    `;
  }
}
