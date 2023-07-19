import { loadFragment } from '../fragment/fragment.js';
import { createElement, addOutsideClickListener } from '../../scripts/scripts.js';

let idx = 0;
/**
 * Open a modal window containing a document.
 * @param {HTMLElement} a Link to the document that will be opened in a modal.
 */
export default async function decorate(block) {
  idx += 1;
  const a = block.querySelector('a');
  if (a) {
    const path = a ? a.getAttribute('href') : block.textContent.trim();
    const fragment = await loadFragment(path);
    if (fragment) {
      const modalId = block.dataset.modalId || `modal-block-${idx}`;
      const dialog = createElement('dialog', 'modal-dialog', { id: modalId });
      dialog.append(...fragment.children);
      block.innerHTML = '';
      block.append(dialog);
      dialog.insertAdjacentHTML('afterbegin', `<div class="dialog-header">
        <span class="dialog-close"></span>
      </div>`);
      dialog.querySelector('.dialog-close').addEventListener('click', () => {
        dialog.close();
      });
    }
  }
}

window.addEventListener('message', (msg) => {
  if (msg.origin === window.location.origin && msg.data && msg.data.showModal) {
    const { modalId } = msg.data;
    const dialogToShow = document.querySelector(`dialog#${modalId}`);
    if (dialogToShow) {
      dialogToShow.showModal();
      addOutsideClickListener(dialogToShow, () => {
        dialogToShow.close();
      });
    }
  }
});
