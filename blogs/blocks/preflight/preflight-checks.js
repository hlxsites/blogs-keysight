// eslint-disable-next-line import/prefer-default-export
export const checks = [];

function isBlogPost(doc) {
  // tbd: add if there are variances of blog post pages
  const templateMetaTag = doc.querySelector('meta[name="template"]');
  if (templateMetaTag && templateMetaTag.content === 'post') {
    return true;
  }
  return false;
}

/**
 * Find the second-level list items and put them into a single array.
 * @returns {Array} An array of tag strings
 */
function getTags(ul) {
  const tagList = ul.querySelectorAll('ul li ul li');
  const tagArray = [...tagList];
  const textArray = tagArray.map((li) => (li.textContent));
  return textArray;
}

checks.push({
  name: 'Has H1',
  category: 'SEO',
  exec: (doc) => {
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
  exec: (doc) => {
    const res = {
      status: true,
      msg: 'Title size is good.',
    };
    const titleSize = doc.title.replace(/\s/g, '').length;
    if (titleSize < 15) {
      res.status = false;
      res.msg = 'Title size is too short (<15 characters).';
    }
    if (titleSize > 70) {
      res.status = false;
      res.msg = 'Title size is too long (>70 characters).';
    }

    return res;
  },
});

checks.push({
  name: 'Meta Description',
  category: 'SEO',
  exec: (doc) => {
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
        res.msg = 'Reason: Meta description too short.';
      } else if (descSize > 150) {
        res.status = false;
        res.msg = 'Reason: Meta description too long.';
      }
    }

    return res;
  },
});

checks.push({
  name: 'Canonical',
  category: 'SEO',
  exec: (doc) => {
    const res = {
      status: true,
      msg: 'Canonical reference is valid.',
    };
    const canon = doc.querySelector("link[rel='canonical']");
    const { href } = canon;
    try {
      fetch(href.replace('www.keysight.com', window.location.hostname), { method: 'HEAD' })
        .then((resp) => {
          if (!resp.ok) {
            res.status = false;
            res.msg = 'Error with canonical reference.';
          }
          if (resp.ok) {
            if (resp.status >= 300 && resp.status <= 308) {
              res.status = false;
              res.msg = 'Canonical reference redirects.';
            } else {
              res.status = true;
              res.msg = 'Canonical referenced is valid.';
            }
          }
        });
    } catch (e) {
      res.status = false;
      res.msg = 'Error with canonical reference.';
    }

    return res;
  },
});

checks.push({
  name: 'Body Size',
  category: 'SEO',
  exec: (doc) => {
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
      res.msg = 'Body does not have enough content.';
    }

    return res;
  },
});

checks.push({
  name: 'Links',
  category: 'SEO',
  exec: (doc) => {
    const res = {
      status: true,
      msg: 'Links are valid.',
    };
    const links = doc.querySelectorAll('body > main a[href]');

    let badLink = false;
    // eslint-disable-next-line no-restricted-syntax
    for (const link of links) {
      const { href } = link;
      try {
        fetch(href.replace('www.keysight.com', window.location.hostname), { method: 'HEAD' })
          // eslint-disable-next-line no-loop-func
          .then((resp) => {
            if (!resp.ok) {
              badLink = true;
            }
          })
          .catch((error) => {
            console.log('error is', error);
            res.status = false;
            res.msg = 'There are seriously broken links.';
            return res;
          });
      } catch (e) {
        badLink = true;
      }
    }

    if (badLink) {
      res.status = false;
      res.msg = 'There are one or more broken links.';
    } else {
      res.status = true;
      res.msg = 'Links are valid.';
    }

    return res;
  },
});

checks.push({
  name: 'Image Alt-Text',
  category: 'SEO',
  exec: (doc) => {
    const res = {
      status: true,
      msg: 'All Images have alt-text.',
    };
    let invalidAltTextCount = 0;
    // if img is a child of these blocks then ignore check
    const blocksToExclude = ['post-card'];
    const imgElements = doc.querySelectorAll('body > main img');
    for (let i = 0; i < imgElements.length; i += 1) {
      const altText = imgElements[i];
      if (!blocksToExclude.includes(altText.closest('div').className) && altText.alt === '') {
        invalidAltTextCount += 1;
      }
    }
    if (invalidAltTextCount > 0) {
      res.status = false;
      res.msg = `${invalidAltTextCount} image(s) have no alt-text.`;
    } else {
      res.status = true;
      res.msg = 'Image alt-text are valid.';
    }

    return res;
  },
});

checks.push({
  name: 'Headings',
  category: 'SEO',
  exec: (doc) => {
    const res = {
      status: true,
      msg: '',
    };
    const sectionIDsToIgnore = ['related-content', 'related-posts'];
    const headerTags = [];
    const headerElements = doc.body.querySelectorAll('h1, h2, h3, h4, h5, h6');

    // eslint-disable-next-line no-restricted-syntax
    for (const element of headerElements) {
      // ignore author post side container, preflight, & sectionIDsToIgnore
      if (!element.className.startsWith('author') && !element.innerText.startsWith('Pre-Flight') && !sectionIDsToIgnore.includes(element.id)) {
        headerTags.push(element.nodeName);
      }
    }

    if (headerTags.length === 1 && headerTags[0] !== 'h1') {
      res.status = false;
      res.msg = 'No H1 on the page.';
    }

    for (let i = 1; i < headerTags.length; i += 1) {
      const previousTag = headerTags[i - 1];
      const currentTag = headerTags[i];

      if (previousTag.charAt(1) > currentTag.charAt(1)) {
        res.status = false;
        res.msg = `Heading tags are out of order:  ${currentTag} came after ${previousTag}`;
      }
    }

    return res;
  },
});

checks.push({
  name: 'Tags',
  category: 'SEO',
  exec: (doc) => {
    const res = {
      status: false,
      msg: 'No tags found.',
    };
    const articleTags = doc.head.querySelectorAll('meta[property="article:tag"]');
    if (articleTags.length > 0) {
      const href = (`${origin}/blogs/tags.plain.html`);
      try {
        fetch(href)
          .then(async (resp) => {
            if (!resp.ok) {
              res.status = false;
              res.msg = 'Error with canonical reference.';
            }
            if (resp && resp.ok) {
              const text = await resp.text();
              const tempElement = document.createElement('div');
              tempElement.innerHTML = text;
              // Get the root <ul> element
              const rootUlElement = tempElement.querySelector('ul');
              // Create the JavaScript array from the nested <ul>
              const tagArray = getTags(rootUlElement);
              let invalidTagCount = 0;
              articleTags.forEach((tag) => {
                if (!tagArray.includes(tag.content)) {
                  invalidTagCount += 1;
                }
              });
              if (invalidTagCount > 0) {
                res.status = false;
                res.msg = `${invalidTagCount} invalid tag(s).`;
              } else {
                res.status = true;
                res.msg = 'Tags are valid.';
              }
              // "return res" does not update html anymore at this point hence below code
              [...doc.querySelector('#preflight-category-panel-SEO').children].forEach((item) => {
                if (item.innerText.startsWith('Tags')) {
                  if (res.status) {
                    item.className = 'preflight-check preflight-check-success';
                  } else {
                    item.className = 'preflight-check preflight-check-failed';
                  }
                  item.getElementsByClassName('preflight-check-msg').item(0).innerText = res.msg;
                }
              });
            }
          });
      } catch (e) {
        res.status = false;
        res.msg = 'Error with tags.';
      }
    }

    return res;
  },
});

checks.push({
  name: 'Hero Image',
  category: 'Blog Post',
  exec: (doc) => {
    const res = {
      status: true,
      msg: 'Blog post has hero image.',
    };

    if (isBlogPost(doc)) {
      const heroImg = doc.querySelector('body > main .hero img');
      if (heroImg && heroImg.src !== '') {
        res.status = true;
        res.msg = 'Blog post has hero image.';
      } else {
        res.status = false;
        res.msg = 'Blog post has no hero image.';
      }
    } else {
      res.status = true;
      res.msg = 'Page is not a blog post.';
    }

    return res;
  },
});

checks.push({
  name: 'Published date',
  category: 'Blog Post',
  exec: (doc) => {
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
        res.msg = 'Blog post has an invalid published date.';
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
  category: 'Blog Post',
  exec: (doc) => {
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
  category: 'Blog Post',
  exec: (doc) => {
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
          fetch(href, { method: 'HEAD' })
            .then((resp) => {
              if (!resp.ok) {
                res.status = false;
                res.msg = "Error with the author's page url.";
              } else {
                res.status = true;
                res.msg = 'Author name and url are valid.';
              }
            });
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
