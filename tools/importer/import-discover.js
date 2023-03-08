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
function buildAuthorPage(document, authorBio, authorLink) {
  const meta = {
    Template: 'author',
  };

  authorBio.querySelector('.uf-author-name').remove();
  authorBio.querySelector('.uf-author-link').remove();

  const image = authorBio.querySelector('.uf-author-avatar > img');
  const bio = authorBio.querySelector('.uf-author-bio');
  meta.Image = image.cloneNode(true);

  const sectionBreak = document.createElement('p');
  sectionBreak.innerHTML = '---';

  bio.parentElement.prepend(sectionBreak);
  bio.parentElement.prepend(image);

  const h1 = document.createElement('h1');
  h1.textContent = authorLink.textContent;
  bio.prepend(h1);
  meta.Title = authorLink.textContent;
  const path = authorLink.getAttribute('href').replace('/discover/', '/blogs/');

  const metdataCells = [
    ['Section Metadata'],
    ['style', 'author-bio'],
  ];
  const sectionMetadataBlock = WebImporter.DOMUtils.createTable(metdataCells, document);
  authorBio.append(sectionMetadataBlock);

  authorBio.append(sectionBreak.cloneNode(true));

  const cells = [
    ['Post Cards'],
  ];
  const postCardsBlock = WebImporter.DOMUtils.createTable(cells, document);
  authorBio.append(postCardsBlock);

  const metaBlock = WebImporter.Blocks.getMetadataBlock(document, meta);
  authorBio.append(metaBlock);

  return {
    element: authorBio,
    path,
  };
}

function buildDiscoverBlog(document, el, url) {
  const pages = [];
  const report = {
    pdfUrls: [],
  };
  const meta = {
    Template: 'post',
  };

  el.querySelector('.uf-cta-beside')?.remove();

  const sectionBreak = document.createElement('p');
  sectionBreak.innerHTML = '---';

  const h1 = el.querySelector('h1.title');
  const title = document.querySelector('title');
  meta.Title = title ? title.textContent : h1.textContent;
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    meta.Description = description.content;
  }

  const text = el.querySelector('.uf-item-entry-content').textContent;
  const wpm = 225;
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / wpm);
  meta['Read Time'] = `${time} min read`;

  const postMeta = el.querySelector('.uf-meta-data');

  let author;
  if (postMeta) {
    const dt = postMeta.querySelector('.uf-datetime > time');
    if (dt) {
      const postDate = new Date(dt.getAttribute('datetime'));
      const year = postDate.getUTCFullYear();
      let month = postDate.getUTCMonth() + 1;
      if (month < 10) month = `0${month}`;
      let day = postDate.getUTCDate();
      if (day < 10) day = `0${day}`;
      meta['Publication Date'] = `${year}-${month}-${day}`;
    } else {
      meta['Publication Date'] = '2023-03-08';
    }

    author = postMeta.querySelector('.uf-author > a');
    if (author) {
      meta.Author = author.textContent;
    } else {
      meta.Author = 'Keysight';
    }
    postMeta.remove();
  } else {
    meta['Publication Date'] = '2023-03-08';
    meta.Author = 'Keysight';
  }

  const authorBio = el.querySelector('.uf-author-profile');
  if (author && authorBio) {
    const authorPage = buildAuthorPage(document, authorBio, author);
    pages.push(authorPage);
    authorBio.remove();
  }

  const image = document.querySelector('meta[name="og:image"]');
  const heroImg = el.querySelector('img');
  if (image) {
    const img = document.createElement('img');
    img.src = image.content;
    meta.Image = img;
  } else if (heroImg) {
    meta.Image = heroImg.cloneNode(true);
  }

  if (heroImg) {
    heroImg.parentElement.append(h1);
    heroImg.parentElement.append(sectionBreak);
  }
  el.append(sectionBreak.cloneNode(true));

  const h3 = document.createElement('h3');
  h3.textContent = 'Related Posts';
  el.append(h3);

  const cells = [
    ['Post Cards'],
    ['limit', '3'],
  ];
  const postCardsBlock = WebImporter.DOMUtils.createTable(cells, document);
  el.append(postCardsBlock);

  let path = url.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const pathSplit = path.split('/');
  const tag = pathSplit[2].replace('-', ' ').split(' ').map((word) => `${word.charAt(0).toUpperCase()}${word.substr(1)}`);
  meta.Tags = tag;
  path = `/blogs/keys/thought-leadership/${pathSplit.slice(3).join('/')}`;

  const metaBlock = WebImporter.Blocks.getMetadataBlock(document, meta);
  el.append(metaBlock);

  // process a few blocks
  el.querySelectorAll('.uf-flipbook.uf-embedded-content').forEach((flipBook) => {
    const iframe = flipBook.querySelector('iframe');
    const { src } = iframe;
    const u = new URL(`https://www.keysight.com/${src}`);
    const newPath = WebImporter.FileUtils.sanitizePath(u.pathname);
    report.pdfUrls.push(u.toString());
    // pages.push({
    //   path: newPath,
    //   from: u.toString(),
    // });
    const pdfUrl = new URL(WebImporter.FileUtils.sanitizePath(newPath), 'https://main--blogs-keysight--hlxsites.hlx.page').toString();
    const blockCells = [
      ['PDF Viewer'],
      ['Source', pdfUrl],
    ];
    const block = WebImporter.DOMUtils.createTable(blockCells, document);
    flipBook.replaceWith(block);
  });

  el.querySelectorAll('video').forEach((video) => {
    const source = video.querySelector('source');
    const link = document.createElement('a');
    link.href = source.src;
    link.innerHTML = source.src;
    const blockCells = [
      ['Video'],
      ['Source', link],
    ];
    const block = WebImporter.DOMUtils.createTable(blockCells, document);
    video.replaceWith(block);
  });

  el.querySelectorAll('iframe').forEach((iframe) => {
    let blockName = 'Embed';
    let { src } = iframe;
    let normalizedSrc = src.startsWith('//') ? `https:${src}` : src;
    normalizedSrc = normalizedSrc.startsWith('/content/dam') ? `https://www.keysight.com${normalizedSrc}` : normalizedSrc;
    const sourceUrl = new URL(normalizedSrc);
    if (sourceUrl.hostname === 'www.youtube.com' && sourceUrl.pathname.startsWith('/embed/')) {
      const vid = sourceUrl.pathname.split('/')[2];
      src = `https://www.youtube.com/watch?v=${vid}`;
    } else {
      src = normalizedSrc;
    }

    if (sourceUrl.hostname === ('www.keysight.com') && sourceUrl.pathname.endsWith('.mp4')) {
      blockName = 'Video';
    }

    const link = document.createElement('a');
    link.href = src;
    link.innerHTML = src;
    const blockCells = [
      [blockName],
      ['Source', link],
    ];
    const block = WebImporter.DOMUtils.createTable(blockCells, document);
    iframe.replaceWith(block);
  });

  pages.push({
    element: el,
    path,
    report,
  });
  return pages;
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

    // TODO
    const article = document.querySelector('.uf-article');
    return buildDiscoverBlog(document, article, urlObject);
  },
};
