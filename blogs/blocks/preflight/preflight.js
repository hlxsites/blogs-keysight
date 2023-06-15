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

function hidePassed(elem) {
  const { checked } = elem.querySelector('#preflight-hidePassed');
  elem.querySelectorAll('.preflight-check-success, .preflight-category-success').forEach((item) => {
    if (checked) {
      item.classList.remove('hide');
    } else {
      item.classList.add('hide');
    }
  });
}

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
  const checkPromises = {};
  checksByCat.forEach((check) => {
    if (curCategory !== check.category) {
      curCategory = check.category;
      const catProp = toClassName(curCategory);
      categoryWrapper = document.createElement('div');
      categoryWrapper.classList.add('preflight-category', 'preflight-category-pending');
      categoryWrapper.dataset.category = curCategory;
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
        const wrapper = e.target.closest('.preflight-category');
        toggle(wrapper);
      });
      categoryPanel = categoryWrapper.querySelector('.preflight-category-panel');
      body.append(categoryWrapper);

      checkPromises[curCategory] = [];
    }

    const checkEl = document.createElement('div');
    checkEl.classList.add(
      'preflight-check',
      'preflight-check-pending',
    );
    checkEl.innerHTML = `
        <p class="preflight-check-title">${check.name}</p>
        <p class="preflight-check-msg">Checking...</p>
    `;
    categoryPanel.append(checkEl);
    const p = check.exec(document);
    checkPromises[curCategory].push(p);
    p.then((res) => {
      const { status, msg } = res;
      checkEl.querySelector('.preflight-check-msg').textContent = msg;
      checkEl.classList.remove('preflight-check-pending');
      checkEl.classList.add(status ? 'preflight-check-success' : 'preflight-check-failed');
    });
  });

  Object.keys(checkPromises).forEach((catKey) => {
    const catPromises = checkPromises[catKey];
    Promise.all(catPromises).then(() => {
      const preflightCat = dialog.querySelector(`.preflight-category[data-category="${catKey}"]`);
      const categoryFailed = preflightCat.querySelector('.preflight-check-failed');
      preflightCat.classList.remove('preflight-category-pending');
      if (categoryFailed) {
        preflightCat.classList.add('preflight-category-failed');
        toggle(preflightCat, true);
      } else {
        preflightCat.classList.add('preflight-category-success');
      }
      hidePassed(dialog);
    });
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
        <div class="hide-wrapper">
          <input type="checkbox" id="preflight-hidePassed" name="preflight-hidePassed" value="yes">
          <label for="preflight-hidePassed">Show All?</label>
        </div>
        <a target="_blank" href="https://main--blogs-keysight--hlxsites.hlx.page/blogs/drafts/documentation/preflight-guide">Pre-flight Guide</a>
      </div>
    </dialog>
  `;
  init(block);
  block.querySelector('#preflight-dialog .preflight-close').addEventListener('click', () => {
    const dialog = block.querySelector('#preflight-dialog');
    dialog.close();
  });

  block.querySelector('#preflight-dialog #preflight-hidePassed').addEventListener('change', () => {
    hidePassed(block);
  });

  window.addEventListener('message', (msg) => {
    if (msg.origin === window.location.origin && msg.data && msg.data.preflightInit) {
      init(block);
    }
  });
}
