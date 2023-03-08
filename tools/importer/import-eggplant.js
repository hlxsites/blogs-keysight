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
      [month, day] = dateParts;
      year = `20${dateParts[2]}`;

      const formattedDate = `${year}-${month}-${day}`;
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
    const urlObject = new URL(params.originalURL);

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

    return [{
      element: document,
      path: urlObject.pathname.replace(/\.html$/, '').replace(/\/$/, ''),
    }];
  },
};
