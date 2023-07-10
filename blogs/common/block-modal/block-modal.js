import { loadCSS } from '../../scripts/lib-franklin.js';

/**
 * This block load another document that may contain blocks to be displayed
 * in the modal window.
 */
const styles$ = new Promise((r) => {
  loadCSS(`${window.hlx.codeBasePath}/common/block-modal/block-modal.css`, r);
});

let bModal;
let focusElement;

export function hideBlockModal() {
  if (!bModal) return;
  bModal.ariaExpanded = false;
  document.body.classList.remove('disable-scroll');
  if (focusElement) focusElement.focus();
}

export async function showBlockModal(content, decorateContent) {
  await styles$;
  if (!bModal) {
    const fragment = document.createRange().createContextualFragment(`
            <div>
                <aside class="modal semitrans-trigger">
                    <button class="close">
                        <img src="/blogs/icons/close.svg">
                    </button>
                    <div></div>
                </aside>
                <div class="semitrans"></div>
            </div>
        `);
    bModal = fragment.querySelector('.modal');
    document.body.append(...fragment.children);

    const button = bModal.querySelector('button.close');
    button.addEventListener('click', () => hideBlockModal());
  }
  const container = bModal.querySelector('div');
  container.replaceChildren(...content);

  if (decorateContent) await decorateContent(container);

  // expand slightly delayed for the animations to work
  setTimeout(() => {
    document.body.classList.add('disable-scroll');
    bModal.ariaExpanded = true;
    const button = bModal.querySelector('button.close');
    button.focus();
  });

  focusElement = document.activeElement;
}
