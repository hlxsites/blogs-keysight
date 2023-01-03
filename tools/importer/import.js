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
function createMetadataBlock(post, document) {
  const meta = {};

  // find the <title> element
  const title = document.querySelector('title');
  if (title) {
    meta.Title = title.innerHTML.replace(/[\n\t]/gm, '');
  }

  // find the <meta property="og:description"> element
  const desc = document.querySelector('meta[name="description"]');
  if (desc) {
    meta.Description = desc.content;
  }

  // find the <meta property="og:image"> element or blog hero
  const blogHeroImg = post.querySelector('img.hero-img');
  if (blogHeroImg) {
    meta.Image = blogHeroImg.cloneNode(true);
  } else {
    const img = document.querySelector('[property="og:image"]');
    if (img) {
      // create an <img> element
      const el = document.createElement('img');
      el.src = img.content;
      meta.Image = el;
    }
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
      metaTags.push(tag.textContent);
    });
    meta.tags = metaTags;
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

  // helper to create the metadata block
  const block = WebImporter.Blocks.getMetadataBlock(document, meta);

  return block;
}

function generateBlogPost(document) {
  const post = document.createElement('div');

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
  }

  const title = document.querySelector('h1.blog-title');
  post.append(title);

  const sectionBreak = document.createElement('p');
  sectionBreak.innerHTML = '---';

  post.append(sectionBreak);

  post.append(document.querySelector('div.rte-body-blog-post'));

  const related = document.querySelector('div.related-content');
  if (related) {
    post.append(sectionBreak.cloneNode(true));
    post.append(related);
  }

  const metaBlock = createMetadataBlock(post, document);
  post.append(metaBlock);

  return post;
}

export default {
  /**
   * Apply DOM operations to the provided document and return
   * the root element to be then transformed to Markdown.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @returns {HTMLElement} The root element to be transformed
   */
  transformDOM: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
    const blogPostContent = generateBlogPost(document);
    return blogPostContent;
  },

  /**
   * Return a path that describes the document being transformed (file name, nesting...).
   * The path is then used to create the corresponding Word document.
   * @param {HTMLDocument} document The document
   * @param {string} url The url of the page imported
   * @param {string} html The raw html (the document is cleaned up during preprocessing)
   * @param {object} params Object containing some parameters given by the import process.
   * @return {string} The path
   */
  generateDocumentPath: ({
    // eslint-disable-next-line no-unused-vars
    document, url, html, params,
  }) => {
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
      const name = pathSegments[7];

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
      const name = pathSegments[6];

      const finalPath = `/${blogs}/${topicCode}/${year}/${month}/${day}/${name}`;
      return finalPath;
    }

    return path;
  },
};
