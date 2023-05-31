const checks = [];

checks.push({
  name: 'Has H1',
  category: 'SEO',
  exec: (doc) => {
    const h1s = doc.querySelectorAll('h1');
    if (h1s.length === 1) {
      return true;
    }

    if (h1s.length === 0) {
      return 'Page must have at least one H1';
    }

    return 'Page must have only 1 H1';
  },
});

// todo add more checks

async function runChecks(block) {
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

  const body = block.querySelector('.preflight-body');
  let curCategory = '';
  let categoryPanel;
  let categoryWrapper;
  checksByCat.forEach((check) => {
    if (curCategory !== check.category) {
      curCategory = check.category;
      categoryWrapper = document.createElement('div');
      categoryWrapper.className = 'preflight-category';
      categoryWrapper.innerHTML = `
        <button class="preflight-category-trigger" aria-expanded="false" 
          aria-controls="preflight-category-panel-${curCategory}" 
          id="preflight-category-trigger-${curCategory}">
          <span class="preflight-category-title">${curCategory}</span>
        </button>
        <div class="preflight-category-panel" 
          id="preflight-category-panel-${curCategory}"
          role="region"
          aria-labelledby="preflight-category-trigger-${curCategory}">
        </div>
      `;
      categoryPanel = categoryWrapper.querySelector('.preflight-category-panel');
      body.append(categoryWrapper);
    }

    const checkResult = check.exec(document);
    const checkSuccess = checkResult === true;
    if (!checkSuccess) categoryWrapper.classList.add('preflight-category-failed');
    const checkEl = document.createElement('div');
    checkEl.classList.add(
      'preflight-check',
      `${checkSuccess ? 'preflight-check-success' : 'preflight-check-failed'}`,
    );
    checkEl.innerHTML = `
      <div class="preflight-check-info">
        <span class="icon ${checkSuccess ? 'icon-preflight-success' : 'icon-preflight-failed'}"></span>
        <p class="preflight-check-title">${check.name}</p>
      </div>
      ${checkSuccess ? '' : `<p class="preflight-check-msg">${checkResult}</p>`}
    `;
    categoryPanel.append(checkEl);
  });
}

export default async function decorate(block) {
  block.innerHTML = `
    <dialog id="preflight-dialog">
      <div class="preflight-header">
        <h2>Franklin Pre-Flight Check</h2>
        <span class="icon icon-close"></span>
      </div>
      <div class="preflight-body">
      </div>
    </dialog>
  `;

  window.addEventListener('message', (msg) => {
    if (msg.origin === window.location.origin && msg.data && msg.data.preflightInit) {
      const dialog = block.querySelector('#preflight-dialog');
      runChecks(block);
      dialog.showModal();
    }
  });
}
