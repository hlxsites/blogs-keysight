import { checks } from './preflight-checks.js';
import { toClassName } from '../../scripts/lib-franklin.js';

const toggle = (item, forceOpen) => {
  const trigger = item.querySelector('.preflight-category-trigger');
  const panel = item.querySelector('.preflight-category-panel');
  const isOpen = forceOpen ? false : trigger.getAttribute('aria-expanded') === 'true';
  trigger.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  if (isOpen) {
    panel.setAttribute('hidden', '');
  } else {
    panel.removeAttribute('hidden');
  }
};

async function runChecks(dialog) {
  const checksByCat = checks.sort((c1, c2) => {
    const cat1 = c1.category.toUpperCase();
    const cat2 = c2.category.toUpperCase();
    if (cat1 > cat2) {
      return -1;
    }
    if (cat1 < cat2) {
      return 1;
    }

    // names must be equal
    return 0;
  });

  const body = dialog.querySelector('.preflight-body');
  body.innerHTML = '';
  let curCategory = '';
  let categoryPanel;
  let categoryWrapper;
  checksByCat.forEach((check) => {
    if (curCategory !== check.category) {
      curCategory = check.category;
      const catProp = toClassName(curCategory);
      categoryWrapper = document.createElement('div');
      categoryWrapper.classList.add('preflight-category', 'preflight-category-success');
      categoryWrapper.innerHTML = `
        <button class="preflight-category-trigger" aria-expanded="false" 
          aria-controls="preflight-category-panel-${catProp}" 
          id="preflight-category-trigger-${catProp}">
          <span class="preflight-category-title">${curCategory}</span>
        </button>
        <div class="preflight-category-panel" 
          id="preflight-category-panel-${catProp}"
          role="region"
          aria-labelledby="preflight-category-trigger-${catProp}" hidden>
        </div>
      `;

      categoryWrapper.querySelector('.preflight-category-trigger').addEventListener('click', (e) => {
        const wrapper = e.target.parentElement;
        toggle(wrapper);
      });
      categoryPanel = categoryWrapper.querySelector('.preflight-category-panel');
      body.append(categoryWrapper);
    }

    const { status, msg } = check.exec(document);

    if (!status) {
      categoryWrapper.classList.remove('preflight-category-success');
      categoryWrapper.classList.add('preflight-category-failed');
      toggle(categoryWrapper, true);
    }
    const checkEl = document.createElement('div');
    checkEl.classList.add(
      'preflight-check',
      `${status ? 'preflight-check-success' : 'preflight-check-failed'}`,
    );
    checkEl.innerHTML = `
        <p class="preflight-check-title">${check.name}</p>
        <p class="preflight-check-msg">${msg}</p>
    `;
    categoryPanel.append(checkEl);
  });
}

function init(block) {
  const dialog = block.querySelector('#preflight-dialog');
  runChecks(dialog);
  dialog.showModal();
}

export default async function decorate(block) {
  block.innerHTML = `
    <dialog id="preflight-dialog">
      <div class="preflight-header">
        <h2>Pre-Flight Check</h2>
        <span class="preflight-close"></span>
      </div>
      <div class="preflight-body">
      </div>
      <div class="preflight-footer">
        <input type="checkbox" id="preflight-hidePassed" name="preflight-hidePassed" value="yes">
        <label for="preflight-hidePassed">Show only Failures?</label>
      </div>
    </dialog>
  `;
  init(block);
  block.querySelector('#preflight-dialog .preflight-close').addEventListener('click', () => {
    const dialog = block.querySelector('#preflight-dialog');
    dialog.close();
  });

  block.querySelector('#preflight-dialog #preflight-hidePassed').addEventListener('change', (evt) => {
    block.querySelectorAll('#preflight-dialog .preflight-check-success, #preflight-dialog .preflight-category-success').forEach((item) => {
      if (evt.target.checked) {
        item.classList.add('hide');
      } else {
        item.classList.remove('hide');
      }
    });
  });

  window.addEventListener('message', (msg) => {
    if (msg.origin === window.location.origin && msg.data && msg.data.preflightInit) {
      init(block);
    }
  });
}
