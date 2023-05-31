// eslint-disable-next-line import/prefer-default-export
export const checks = [];

checks.push({
  name: 'Has H1',
  category: 'SEO',
  exec: (doc) => {
    const h1s = doc.querySelectorAll('h1');
    if (h1s.length === 1) {
      return true;
    }

    if (h1s.length === 0) {
      return 'No H1 on the page.';
    }

    return 'More than one H1 on the page.';
  },
});

checks.push({
  name: 'Page Title',
  category: 'SEO',
  exec: (doc) => {
    const titleSize = doc.title.replace(/\s/g, '').length;
    if (titleSize < 15) {
      return 'Title size is too short.';
    }
    if (titleSize > 70) {
      return 'Title size is too long.';
    }

    return true;
  },
});
