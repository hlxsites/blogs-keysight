import { checks } from './preflight-checks.js';

// todo add more checks

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
      categoryWrapper = document.createElement('div');
      categoryWrapper.classList.add('preflight-category', 'preflight-category-success');
      categoryWrapper.innerHTML = `
        <button class="preflight-category-trigger" aria-expanded="false" 
          aria-controls="preflight-category-panel-${curCategory}" 
          id="preflight-category-trigger-${curCategory}">
          <span class="preflight-category-title">${curCategory}</span>
        </button>
        <div class="preflight-category-panel" 
          id="preflight-category-panel-${curCategory}"
          role="region"
          aria-labelledby="preflight-category-trigger-${curCategory}" hidden>
        </div>
      `;

      categoryWrapper.querySelector('.preflight-category-trigger').addEventListener('click', () => {
        toggle(categoryWrapper);
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
        <h2>Franklin Pre-Flight Check</h2>
        <span class="preflight-close"></span>
      </div>
      <div class="preflight-body">
      </div>
    </dialog>
  `;
  init(block);
  block.querySelector('#preflight-dialog .preflight-close').addEventListener('click', () => {
    const dialog = block.querySelector('#preflight-dialog');
    dialog.close();
  });

  window.addEventListener('message', (msg) => {
    if (msg.origin === window.location.origin && msg.data && msg.data.preflightInit) {
      init(block);
    }
  });
}
