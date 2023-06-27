/* eslint-disable import/prefer-default-export */
import {
  decorateSections, decorateBlocks, loadBlocks, decorateButtons, decorateIcons, loadCSS,
} from '../../scripts/lib-franklin.js';

/**
 * Open a modal window 
 * @param {HTMLElement} a Link to the document that will be opened in a modal 
 */
export async function showModal(a) {
  const { href, title } = a;
  const module$ = import(`${window.hlx.codeBasePath}/common/block-modal/block-modal.js`);
  const styles$ = loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);
  const content = await fetch(`${href}.plain.html`);

  async function decorateModal(container) {
    decorateButtons(container);
    decorateIcons(container);
    decorateSections(container);
    decorateBlocks(container);

    container.classList.add('block-modal');
    const [title, docBody] = container.children;
    title.classList.add('header');
    docBody.classList.add('block-body');
    await loadBlocks(container);
  }

  if (content.ok) {
    const html = await content.text();
    const fragment = document.createRange().createContextualFragment(html);
    const [module] = await Promise.all([module$, styles$]);
    module.showBlockModal(fragment.children, decorateModal);
  }
}
