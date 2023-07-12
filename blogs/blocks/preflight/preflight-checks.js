import { PRODUCTION_DOMAINS, PRODUCTION_PATHS } from '../../scripts/scripts.js';
// import { validateTags } from '../../scripts/taxonomy.js';
// eslint-disable-next-line import/prefer-default-export
export const checks = [];

/**
 * Check if page is a Blog post using meta tag.
 * @returns {boolean} true if blog post page
 */
function isBlogPost(doc) {
  // tbd: add if there are variances of blog post pages
  const templateMetaTag = doc.querySelector('meta[name="template"]');
  if (templateMetaTag && templateMetaTag.content === 'post') {
    return true;
  }
  return false;
}

checks.push({
  name: 'Has H1',
  category: 'SEO',
  exec: async (doc) => {
    const res = {
      status: true,
      msg: '',
    };
    const h1s = doc.querySelectorAll('h1');
    if (h1s.length === 1) {
      res.status = true;
      res.msg = 'Only one H1 on the page.';
      return res;
    }

    res.status = false;

    if (h1s.length === 0) {
      res.msg = 'No H1 on the page.';
    }

    res.msg = 'More than one H1 on the page.';

    return res;
  },
});

checks.push({
  name: 'Page Title',
  category: 'SEO',
  exec: async (doc) => {
    const res = {
      status: true,
      msg: 'Title size is good.',
    };
    const titleSize = doc.title.replace(/\s/g, '').length;
    if (titleSize < 15) {
      res.status = false;
      res.msg = 'Title size is too short (must be at least 15 characters).';
    }
    if (titleSize > 70) {
      res.status = false;
      res.msg = 'Title size is too long (must be no more than 70 characters).';
    }

    return res;
  },
});

checks.push({
  name: 'Meta Description',
  category: 'SEO',
  exec: async (doc) => {
    const res = {
      status: true,
      msg: 'Meta description size is good.',
    };
    const metaDesc = doc.querySelector('meta[name="description"]');
    if (!metaDesc) {
      res.status = false;
      res.msg = 'No meta description found.';
    } else {
      const descSize = metaDesc.content.replace(/\s/g, '').length;
      if (descSize < 50) {
        res.status = false;
        res.msg = 'Meta description too short (must be at least 50 characters).';
      } else if (descSize > 150) {
        res.status = false;
        res.msg = 'Meta description too long (must be no more than 150 characters).';
      }
    }

    return res;
  },
});

checks.push({
  name: 'Body Size',
  category: 'SEO',
  exec: async (doc) => {
    const res = {
      status: true,
      msg: 'Body size is good.',
    };
    const bodySize = doc.documentElement.innerText.replace(/\s/g, '').length;
    if (bodySize > 200) {
      res.status = true;
      res.msg = 'Body content has a good length.';
    } else {
      res.status = false;
      res.msg = 'Body does not have enough content, Must be at least 200 characters.';
    }

    return res;
  },
});

checks.push({
  name: 'Links',
  category: 'Content & Metadata',
  exec: async (doc) => {
    const res = {
      status: true,
      msg: 'All Links are valid.',
    };
    // using array for less code. arr[0] for 404 count; arr[1] for fetch exception error count
    const errorSummary = {
      notFoundCount: 0,
      exceptionCount: 0,
    };
    const links = doc.querySelectorAll('body > main a[href]');
    const ignoredBlocks = ['post-sidebar', 'post-cards', 'tags', 'preflight', 'topics'];
    await Promise.all([...links].map(async (link) => {
      const block = link.closest('.block');
      if (block) {
        const isIngored = [...block.classList]
          .some((blockName) => ignoredBlocks.includes(blockName));
        if (isIngored) {
          return;
        }
      }
      const url = new URL(link.href);
      const hosts = ['hlx.page', 'hlx.live', ...PRODUCTION_DOMAINS];
      const hostMatch = hosts.some((host) => url.hostname.includes(host));
      const pathMatch = PRODUCTION_PATHS.some((path) => url.pathname.startsWith(path));
      if (hostMatch && pathMatch) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const resp = await fetch(url, { method: 'HEAD' });
          if (!resp.ok) {
            errorSummary.notFoundCount += 1;
            res.status = false;
          }
        } catch {
          errorSummary.exceptionCount += 1;
          res.status = false;
        }
      }
    }));

    if (!res.status) {
      res.msg = `Page contains invalid links: ${errorSummary.notFoundCount} returned a 404; ${errorSummary.exceptionCount} cannot be validated`;
    }

    return res;
  },
});

checks.push({
  name: 'Headings',
  category: 'SEO',
  exec: async (doc) => {
    const res = {
      status: true,
      msg: 'Headings are valid.',
    };
    const headerElements = doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6');

    let prevLevel;
    // eslint-disable-next-line no-restricted-syntax
    for (const element of headerElements) {
      const elemLevel = Number(element.tagName.substring(1));
      if (prevLevel) {
        if (elemLevel > prevLevel && prevLevel + 1 !== elemLevel) {
          res.status = false;
          res.msg = `Headings are out of order: ${element.textContent} (${element.tagName}) came after H${prevLevel}`;
        }
      }

      prevLevel = elemLevel;
    }

    return res;
  },
});

checks.push({
  name: 'Image Alt-Text',
  category: 'Accessibilty',
  exec: async (doc) => {
    const res = {
      status: true,
      msg: 'All Images have alt text.',
    };
    let invalidAltTextCount = 0;
    // if img is a child of these blocks then ignore check
    const ignoredBlocks = ['post-cards', 'featured-posts'];
    const imgElements = doc.querySelectorAll('body > main img');
    for (let i = 0; i < imgElements.length; i += 1) {
      const altText = imgElements[i];
      const block = altText.closest('.block');
      let isIgnored = false;
      if (block) {
        isIgnored = [...block.classList]
          .some((blockName) => ignoredBlocks.includes(blockName));
      }
      if (!isIgnored && altText.alt === '') {
        invalidAltTextCount += 1;
      }
    }
    if (invalidAltTextCount > 0) {
      res.status = false;
      res.msg = `${invalidAltTextCount} image(s) have no alt text.`;
    } else {
      res.status = true;
      res.msg = 'All images have alt text.';
    }

    return res;
  },
});

/* commenting out tags check for now, will re-add as part of aem-tags
checks.push({
  name: 'Tags',
  category: 'Content & Metadata',
  exec: async (doc) => {
    const res = {
      status: true,
      msg: 'No tags found.',
    };
    const articleTags = [...doc.head.querySelectorAll('meta[property="article:tag"]')]
    .map((tagMeta) => tagMeta.content);
    if (articleTags.length > 0) {
      const [, invalid] = await validateTags(articleTags);
      if (invalid.length === 0) {
        res.msg = 'All tags are valid';
      } else {
        res.status = false;
        res.msg = `${invalid.length} Invalid tags. ${invalid.join(', ')}`;
      }
    } else if (isBlogPost(doc)) {
      res.status = false;
      res.msg = 'Blog posts must have at least 1 tag.';
    }

    return res;
  },
});
*/

checks.push({
  name: 'Hero Image',
  category: 'Content & Metadata',
  exec: async (doc) => {
    const res = {
      status: true,
      msg: 'Page has a hero image.',
    };

    const heroImg = doc.querySelector('body > main .hero img');
    if (heroImg && heroImg.src !== '') {
      res.status = true;
      res.msg = 'Page has a hero image.';
    } else {
      res.status = false;
      res.msg = 'Page has no hero image.';
    }

    return res;
  },
});

checks.push({
  name: 'Published date',
  category: 'Content & Metadata',
  exec: async (doc) => {
    const res = {
      status: false,
      msg: 'Blog post has published date',
    };
    if (isBlogPost(doc)) {
      const dateRegex = /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/;
      const publishedDateMetaTag = doc.querySelector('meta[name="publication-date"]');
      if (publishedDateMetaTag && dateRegex.test(publishedDateMetaTag.content)) {
        res.status = true;
        res.msg = 'Blog post has a valid published date.';
      } else {
        res.status = false;
        res.msg = 'Blog post has an invalid published date (should be YYYY-MM-DD).';
      }
    } else {
      res.status = true;
      res.msg = 'Page is not a blog post.';
    }

    return res;
  },
});

checks.push({
  name: 'Read time',
  category: 'Content & Metadata',
  exec: async (doc) => {
    const res = {
      status: false,
      msg: 'Blog post has read time',
    };
    if (isBlogPost(doc)) {
      const readTimeRegex = /^(0*[1-9]\d*) (min read)$/;
      const readTimeMetaTag = doc.querySelector('meta[name="read-time"]');
      if (readTimeMetaTag && readTimeRegex.test(readTimeMetaTag.content)) {
        res.status = true;
        res.msg = 'Blog post has read time.';
      } else {
        res.status = false;
        res.msg = 'Blog post has no valid read time.';
      }
    } else {
      res.status = true;
      res.msg = 'Page is not a blog post.';
    }

    return res;
  },
});

checks.push({
  name: 'Author',
  category: 'Content & Metadata',
  exec: async (doc) => {
    const res = {
      status: true,
      msg: 'Author is valid.',
    };
    if (isBlogPost(doc)) {
      const author = doc.querySelector('.post-sidebar > .author-details > .author-name > a');
      if (!author) {
        res.status = false;
        res.msg = "Author's name is missing.";
        return res;
      }
      if (author.innerText === '') {
        res.status = false;
        res.msg = "Author's name is missing.";
        return res;
      }
      const { href } = author;
      if (href !== '' && href !== `${window.location.href}#`) {
        try {
          const resp = await fetch(href, { method: 'HEAD' });
          if (!resp.ok) {
            res.status = false;
            res.msg = "Error with the author's page url.";
          } else {
            res.status = true;
            res.msg = 'Author name and url are valid.';
          }
        } catch (e) {
          res.status = false;
          res.msg = 'Error with author page url.';
        }
      } else {
        res.status = false;
        res.msg = "Author's page url is missing.";
      }
    } else {
      res.status = true;
      res.msg = 'Page is not a blog post.';
    }

    return res;
  },
});
