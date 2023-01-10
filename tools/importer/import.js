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
    const blogs = pathSegments[1];
    const topicCode = pathSegments[2];
    const subTopicPath = pathSegments[3];
    const subTopicCode = subTopicPath.split('.')[0];
    const year = pathSegments[4];
    const month = pathSegments[5];
    const day = pathSegments[6];
    const name = titleToName(blogPostElement.querySelector('h1.blog-title').textContent);

    const finalPath = `/${blogs}/${topicCode}/${subTopicCode}/${year}/${month}/${day}/${name}`;
    return finalPath;
  }
  if (pathSegments.length === 7) {
    const blogs = pathSegments[1];
    const topicPath = pathSegments[2];
    const topicCode = topicPath.split('.')[0];
    const year = pathSegments[3];
    const month = pathSegments[4];
    const day = pathSegments[5];
    const name = titleToName(blogPostElement.querySelector('h1.blog-title').textContent);

    const finalPath = `/${blogs}/${topicCode}/${year}/${month}/${day}/${name}`;
    return finalPath;
  }

  return path;
}

function generateAuthorPath(authorContent, url) {
  const path = new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const pathSegments = path.split('/');
  const blogs = pathSegments[1];
  const name = titleToName(authorContent.querySelector('h1#bio-name').textContent);

  const finalPath = `/${blogs}/authors/${name}`;
  return finalPath;
}

function generateAuthor(document, url) {
  const author = document.createElement('div');
  const meta = {
    template: 'author',
  };

  const img = document.createElement('img');
  const profileUrlStart = url.indexOf('/home');
  const profileUrlEnd = url.indexOf('?host');
  const profileUrl = url.substr(profileUrlStart, profileUrlEnd - profileUrlStart);
  img.src = `${profileUrl}/photos/primary/image.prof.48.png`;
  meta.image = img.cloneNode(true);
  author.append(img);

  const sectionBreak = document.createElement('p');
  sectionBreak.innerHTML = '---';
  author.append(sectionBreak);

  const name = document.querySelector('#bio-name');
  if (name) {
    meta.title = name.textContent;
    author.append(name);
  }

  const title = document.querySelector('#bio-title');
  if (title) {
    meta.authorTitle = title.textContent;
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
    ['filter', 'author'],
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
    template: 'post',
  };

  // get the hero image and append it
  const heroBlog = document.querySelector('.hero-blog');
  if (heroBlog) {
    // this fixes the style background so it works properly, kind of a hack
    const style = heroBlog.getAttribute('style');
    heroBlog.style = '';
    const startIndex = style.indexOf('url("') + 5;
    const endIndex = style.indexOf('")');
    const heroImgUrl = style.substr(startIndex, endIndex - startIndex);
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
  post.append(postContent);

  const related = document.querySelector('#blogs_related_content');
  if (related) {
    post.append(sectionBreak.cloneNode(true));
    const relContentHead = document.createElement('h3');
    relContentHead.textContent = 'Related Content';
    post.append(relContentHead);
    const colsLayout = related.querySelector('.layout-multicolumn');
    const cols = colsLayout.querySelectorAll(':scope > div');

    const colsCells = [
      ['Columns'],
      [...cols],
    ];
    const relatedCols = WebImporter.DOMUtils.createTable(colsCells, document);
    post.append(relatedCols);
  }

  post.append(sectionBreak.cloneNode(true));

  const h3 = document.createElement('h3');
  h3.textContent = 'Related Posts';
  post.append(h3);

  const cells = [
    ['Post Cards'],
    ['filter', 'post'],
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
      meta.author = authorName;
    }
  }

  const tags = document.querySelectorAll('.blog-post-tags ul > li');
  const metaTags = [];
  if (tags) {
    tags.forEach((tag) => {
      metaTags.push(tag.textContent.replace('#', '').trim());
    });
    if (metaTags.length > 0) {
      meta.tags = metaTags.join(', ');
    }
  }

  const blogDate = document.querySelector('.blog-date');
  if (blogDate) {
    blogDate.textContent.trim().split('|').forEach((part) => {
      const partContent = part.trim();
      const dateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
      const timeRegex = /^[0-9]{1,2} min read$/;
      if (dateRegex.test(partContent)) {
        meta['publication date'] = partContent;
      } else if (timeRegex.test(partContent)) {
        meta.readTime = partContent;
      }
    });
  }

  const metaBlock = WebImporter.Blocks.getMetadataBlock(document, meta);
  post.append(metaBlock);

  return post;
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
    const blogRte = document.querySelector('div.rte-body-blog-post');
    if (blogRte) {
      const blogPostElement = generateBlogPost(document);
      const blogPostPath = generateBlogPostPath(blogPostElement, url);
      return [{
        element: blogPostElement,
        path: blogPostPath,
      }];
    }

    const authorBio = document.querySelector('.authorbio');
    if (authorBio) {
      const authorContent = generateAuthor(document, url);
      return [{
        element: authorContent,
        path: generateAuthorPath(authorContent, url),
      }];
    }

    return [{
      element: document.querySelector('#mainsection'),
      path: new URL(url).pathname.replace(/\.html$/, '').replace(/\/$/, ''),
    }];
  },
};
