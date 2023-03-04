/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* global WebImporter */
/* eslint-disable no-console, class-methods-use-this */
function titleToName(title) {
  let name = title.toLowerCase();
  name = name.trim().replaceAll(' ', '-');
  name = name.replace(/[^a-zA-Z0-9-]/g, '');
  while (name.indexOf('--') > -1) {
    name = name.replace('--', '-');
  }

  return name;
}

function generateBlogPostPath(blogPostElement, url) {
  const path = new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const pathSegments = path.split('/');
  if (pathSegments.length === 8) {
    const topicCode = pathSegments[2];
    const subTopicPath = pathSegments[3];
    const subTopicCode = subTopicPath.split('.')[0];
    const year = pathSegments[4];
    const month = pathSegments[5];
    const day = pathSegments[6];
    const name = titleToName(blogPostElement.querySelector('h1.blog-title').textContent);

    const finalPath = `/${topicCode}/${subTopicCode}/${year}/${month}/${day}/${name}`;
    return finalPath;
  }
  if (pathSegments.length === 7) {
    const topicPath = pathSegments[2];
    const topicCode = topicPath.split('.')[0];
    const year = pathSegments[3];
    const month = pathSegments[4];
    const day = pathSegments[5];
    const name = titleToName(blogPostElement.querySelector('h1.blog-title').textContent);

    const finalPath = `/${topicCode}/${year}/${month}/${day}/${name}`;
    return finalPath;
  }

  return path;
}

function generateAuthorPath(authorContent) {
  const name = titleToName(authorContent.querySelector('h1#bio-name').textContent);

  const finalPath = `/authors/${name}`;
  return finalPath;
}

function generateAuthor(document, url) {
  const author = document.createElement('div');
  const meta = {
    Template: 'author',
  };

  const img = document.createElement('img');
  const profileUrlStart = url.indexOf('/home');
  const profileUrlEnd = url.indexOf('?host');
  const profileUrl = url.substr(profileUrlStart, profileUrlEnd - profileUrlStart);
  img.src = `${profileUrl}/photos/primary/image.prof.48.png`;
  meta.Image = img.cloneNode(true);
  author.append(img);

  const sectionBreak = document.createElement('p');
  sectionBreak.innerHTML = '---';
  author.append(sectionBreak);

  const name = document.querySelector('#bio-name');
  if (name) {
    meta.Title = name.textContent;
    author.append(name);
  }

  const title = document.querySelector('#bio-title');
  if (title) {
    meta['Author Title'] = title.textContent;
    const titleH2 = document.createElement('h2');
    titleH2.textContent = title.textContent;
    author.append(titleH2);
  }

  const social = document.querySelector('#bio-social');
  if (social) {
    const socialList = document.createElement('ul');
    social.querySelectorAll('a').forEach((link) => {
      const li = document.createElement('li');
      li.append(link);
      if (!link.href.startsWith('http')) {
        link.href = `https://${link.href}`;
      }
      link.textContent = link.href;
      socialList.append(li);
    });
    author.append(socialList);
  }
  author.append(document.querySelector('#bio-desc'));

  const metdataCells = [
    ['Section Metadata'],
    ['style', 'author-bio'],
  ];
  const sectionMetadataBlock = WebImporter.DOMUtils.createTable(metdataCells, document);
  author.append(sectionMetadataBlock);

  author.append(sectionBreak.cloneNode(true));

  const cells = [
    ['Post Cards'],
  ];
  const postCardsBlock = WebImporter.DOMUtils.createTable(cells, document);
  author.append(postCardsBlock);

  const metaBlock = WebImporter.Blocks.getMetadataBlock(document, meta);
  author.append(metaBlock);

  return author;
}

function generateBlogPost(document) {
  const post = document.createElement('div');
  const meta = {
    Template: 'post',
  };

  // get the hero image and append it
  const heroBlog = document.querySelector('.hero-blog');
  if (heroBlog) {
    // this fixes the style background so it works properly, kind of a hack
    const style = heroBlog.getAttribute('style');
    heroBlog.style = '';
    const startIndex = style.indexOf('url("') + 5;
    const endIndex = style.indexOf('")');
    let heroImgUrl = style.substr(startIndex, endIndex - startIndex);
    if (heroImgUrl.includes('stgblogs.keysight')) {
      heroImgUrl = heroImgUrl.replace('stgblogs.keysight.', 'blogs.keysight.');
    }
    heroBlog.style.backgroundImage = `url("${heroImgUrl}")`;
    const img = WebImporter.DOMUtils.replaceBackgroundByImg(heroBlog, document);
    img.classList.add('hero-img');
    post.append(img);
    meta.Image = img.cloneNode(true);
  }

  const sectionBreak = document.createElement('p');
  sectionBreak.innerHTML = '---';

  post.append(sectionBreak);

  const title = document.querySelector('h1.blog-title');
  meta.Title = title.textContent;
  post.append(title);

  const postContent = document.querySelector('div.rte-body-blog-post');
  postContent.querySelectorAll('img').forEach((img) => {
    const parent = img.parentElement;
    if (parent.childNodes.length === 1 && parent.tagName === 'A') {
      // link is to an image, remove link entirely, can be re-wried on front end if we need to
      parent.replaceWith(img);
    }
  });
  postContent.querySelectorAll('.embeddedContent').forEach((embed) => {
    let src = embed.getAttribute('data-oembed');
    if (!src) {
      const iframe = embed.querySelector('iframe');
      if (iframe) {
        const normalizedSrc = iframe.src.startsWith('//') ? `https:${iframe.src}` : iframe.src;
        const sourceUrl = new URL(normalizedSrc);
        if (sourceUrl.hostname === 'www.youtube.com' && sourceUrl.pathname.startsWith('/embed/')) {
          const vid = sourceUrl.pathname.split('/')[2];
          src = `https://www.youtube.com/watch?v=${vid}`;
        } else {
          src = iframe.src;
        }
      }
    }
    if (src) {
      console.log(`creating embed with src ${src}`);
      const link = document.createElement('a');
      link.href = src;
      link.innerHTML = src;
      const embedCells = [
        ['Embed'],
        ['Source', link],
      ];
      const embedBlock = WebImporter.DOMUtils.createTable(embedCells, document);
      embed.replaceWith(embedBlock);
    } else {
      console.error(`removing embed, no src found ${embed.outerHTML}`);
    }
  });
  postContent.querySelectorAll('figcaption').forEach((caption) => {
    const em = document.createElement('em');
    em.textContent = caption.textContent;
    caption.replaceWith(em);
  });
  postContent.querySelectorAll('table').forEach((table) => {
    if (table.childElementCount === 0) {
      table.remove();
    }
  });
  post.append(postContent);

  const related = document.querySelector('#blogs_related_content');
  if (related) {
    post.append(sectionBreak.cloneNode(true));
    const relContentHead = document.createElement('h3');
    relContentHead.textContent = 'Related Content';
    post.append(relContentHead);
    const colsLayout = related.querySelector('.layout-multicolumn');
    const cols = [...colsLayout.querySelectorAll(':scope > div')].map((col) => {
      const colContent = document.createElement('div');

      const category = col.querySelector('.related-content-category');
      let colHasContent = false;
      if (category) {
        colHasContent = true;
        colContent.append(category);
      }

      const links = col.querySelectorAll('a');
      links.forEach((link) => {
        const linksItem = document.createElement('p');
        colHasContent = true;
        linksItem.append(link);
        colContent.append(linksItem);
      });
      return colHasContent ? colContent : null;
    }).filter((col) => col !== null);

    if (cols.length > 0) {
      const colsCells = [
        ['Related Content'],
        [...cols],
      ];
      const relatedCols = WebImporter.DOMUtils.createTable(colsCells, document);
      post.append(relatedCols);
    }
  }

  post.append(sectionBreak.cloneNode(true));

  const h3 = document.createElement('h3');
  h3.textContent = 'Related Posts';
  post.append(h3);

  const cells = [
    ['Post Cards'],
    ['limit', '3'],
  ];
  const postCardsBlock = WebImporter.DOMUtils.createTable(cells, document);
  post.append(postCardsBlock);

  const desc = document.querySelector('.wrapper meta[name="description"]');
  if (desc) {
    meta.Description = desc.content;
  } else {
    meta.Description = document.querySelector('div.rte-body-blog-post > p').textContent;
  }

  const author = document.querySelector('.author-name');
  if (author) {
    const authorName = author.textContent;
    if (authorName) {
      meta.Author = authorName;
    }
  }

  const tags = document.querySelectorAll('.blog-post-tags ul > li');
  const metaTags = [];
  if (tags) {
    tags.forEach((tag) => {
      metaTags.push(tag.textContent.replace('#', '').trim());
    });
    if (metaTags.length > 0) {
      meta.Tags = metaTags.join(', ');
    }
  }

  const blogDate = document.querySelector('.blog-date');
  if (blogDate) {
    blogDate.textContent.trim().split('|').forEach((part) => {
      const partContent = part.trim();
      const dateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
      const timeRegex = /^[0-9]{1,2} min read$/;
      if (dateRegex.test(partContent)) {
        meta['Publication Date'] = partContent;
      } else if (timeRegex.test(partContent)) {
        meta['Read Time'] = partContent;
      }
    });
  }

  const metaBlock = WebImporter.Blocks.getMetadataBlock(document, meta);
  post.append(metaBlock);

  return post;
}

function buildEggplantAuthor(doc) {
  const author = doc.createElement('div');
  const meta = {
    Template: 'author',
  };
  const img = doc.querySelector('div.img-circle img');
  if (img) {
    author.append(img);
    meta.Image = img.cloneNode(true);
  }

  const sectionBreak = doc.createElement('p');
  sectionBreak.innerHTML = '---';
  author.append(sectionBreak);

  const name = doc.querySelector('.listing-template h1');
  const desc = doc.querySelector('.listing-template h1 ~ p');
  if (name) {
    meta.Title = name.textContent;
    author.append(name);
  }
  meta['Author Title'] = '';

  const social = doc.querySelector('.hs_cos_wrapper_type_follow_me');
  if (social) {
    const socialList = doc.createElement('ul');
    social.querySelectorAll('a').forEach((link) => {
      const li = doc.createElement('li');
      li.append(link);
      if (!link.href.startsWith('http')) {
        link.href = `https://${link.href}`;
      }
      link.textContent = link.href;
      socialList.append(li);
    });
    author.append(socialList);
  }

  if (desc) {
    author.append(desc);
  }

  const metdataCells = [
    ['Section Metadata'],
    ['style', 'author-bio'],
  ];
  const sectionMetadataBlock = WebImporter.DOMUtils.createTable(metdataCells, doc);
  author.append(sectionMetadataBlock);

  author.append(sectionBreak.cloneNode(true));

  const cells = [
    ['Post Cards'],
  ];
  const postCardsBlock = WebImporter.DOMUtils.createTable(cells, doc);
  author.append(postCardsBlock);

  const metaBlock = WebImporter.Blocks.getMetadataBlock(doc, meta);
  author.append(metaBlock);

  return author;
}

function generateEggplantBlogPost(doc, postContent, topicLinks) {
  const meta = {
    Template: 'post',
  };

  const sectionBreak = doc.createElement('p');
  sectionBreak.innerHTML = '---';
  postContent.prepend(sectionBreak);

  const heroImage = doc.querySelector('meta[property="og:image"]');
  const img = doc.createElement('img');
  img.src = heroImage.content;
  postContent.prepend(img);
  meta.Image = img.cloneNode(true);

  postContent.querySelectorAll('iframe').forEach((iframe) => {
    const normalizedSrc = iframe.src.startsWith('//') ? `https:${iframe.src}` : iframe.src;
    const sourceUrl = new URL(normalizedSrc);
    let { src } = iframe;
    if (sourceUrl.hostname === 'www.youtube.com' && sourceUrl.pathname.startsWith('/embed/')) {
      const vid = sourceUrl.pathname.split('/')[2];
      src = `https://www.youtube.com/watch?v=${vid}`;
    }
    const link = doc.createElement('a');
    link.href = src;
    link.innerHTML = src;
    const embedCells = [
      ['Embed'],
      ['Source', link],
    ];
    const embedBlock = WebImporter.DOMUtils.createTable(embedCells, doc);
    iframe.replaceWith(embedBlock);
  });

  postContent.querySelectorAll('a img').forEach((linkedImg) => {
    const a = linkedImg.closest('a');
    const { href } = a;
    const p = a.closest('p');
    const newA = doc.createElement('a');
    newA.href = href;
    newA.innerHTML = href;
    const newP = doc.createElement('p');
    newP.append(newA);
    p.insertAdjacentElement('afterend', newP);
    a.replaceWith(linkedImg);
  });

  const authorLink = postContent.querySelector('a[href*="/author/"]');
  let day = '4';
  let month = '3';
  let year = '2023';
  if (authorLink) {
    meta.Author = authorLink.textContent;
    const parent = authorLink.parentElement;
    const authorContent = parent.textContent;
    const dateRegex = /[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2}/;
    const date = authorContent.match(dateRegex);
    if (date && date[0]) {
      const dateParts = date[0].split('/');
      day = dateParts[1];
      month = dateParts[0];
      year = `20${dateParts[2]}`;

      const formattedDate = `20${year}-${month}-${day}`;
      meta['Publication Date'] = formattedDate;
      parent.remove();
    }
  }

  const desc = doc.querySelector('meta[name="description"]');
  if (desc) {
    meta.Description = desc.content;
  } else {
    meta.Description = postContent.querySelector('#hs_cos_wrapper_post_body > p').textContent;
  }

  const metaTags = [];
  if (topicLinks) {
    topicLinks.forEach((tag) => {
      metaTags.push(tag.textContent.replace('#', '').trim());
    });
    if (metaTags.length > 0) {
      meta['Migrated Tags'] = metaTags.join(', ');
    }
  }
  meta.tags = 'applicationsoftwaretesting';
  // meta['Read Time']

  postContent.append(sectionBreak.cloneNode(true));

  const h3 = doc.createElement('h3');
  h3.textContent = 'Related Posts';
  postContent.append(h3);

  const cells = [
    ['Post Cards'],
    ['limit', '3'],
  ];
  const postCardsBlock = WebImporter.DOMUtils.createTable(cells, doc);
  postContent.append(postCardsBlock);

  const metaBlock = WebImporter.Blocks.getMetadataBlock(doc, meta);
  postContent.append(metaBlock);

  return {
    el: postContent,
    path: `/blogs/${year}/${month}/${day}`,
  };
}

export default {
  /**
   * Apply DOM operations to the provided document and return an array of
   * objects ({ element: HTMLElement, path: string }) to be transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {Array} The { element, path } pairs to be transformed
   */
  transform: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const urlObject = new URL(url);
    const isEggplant = url.includes('blog.eggplantsoftware.com');
    if (isEggplant) {
      const blogRte = document.querySelector('div.post-body');
      if (blogRte) {
        const topics = document.querySelectorAll('.post-bottom > a');
        const authorLink = blogRte.querySelector('a[href*="/author/"]');
        const eggplantPost = generateEggplantBlogPost(document, blogRte, topics);

        return [{
          element: eggplantPost.el,
          path: `${eggplantPost.path}/${urlObject.pathname}`,
          report: {
            author: authorLink ? authorLink.href : '',
          },
        }];
      }
      if (urlObject.pathname.startsWith('/author/')) {
        const author = buildEggplantAuthor(document);
        return [{
          element: author,
          path: urlObject.pathname.replace('/author/', '/authors/'),
        }];
      }
    }

    const blogRte = document.querySelector('div.rte-body-blog-post');
    if (blogRte) {
      const blogPostElement = generateBlogPost(document);
      const blogPostPath = generateBlogPostPath(blogPostElement, url);

      const authorLink = document.querySelector('a[href^="/blogs/author.html/"]');

      return [{
        element: blogPostElement,
        path: blogPostPath,
        report: {
          author: `https://blogs.keysight.com${authorLink.href}`,
        },
      }];
    }

    const authorBio = document.querySelector('.authorbio');
    if (authorBio) {
      const authorContent = generateAuthor(document, url);
      return [{
        element: authorContent,
        path: generateAuthorPath(authorContent),
      }];
    }

    return [{
      element: document.querySelector('#mainsection'),
      path: urlObject.pathname.replace(/\.html$/, '').replace(/\/$/, ''),
    }];
  },
};
