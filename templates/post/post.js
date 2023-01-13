import { getMetadata, createOptimizedPicture, decorateIcons } from '../../scripts/lib-franklin.js';
import { createElement, getPosts } from '../../scripts/scripts.js';

async function buildAuthorImage(sidebar, author) {
  let authorImage;
  let authorName;
  let authorTitle;
  let authorUrl;
  const posts = await getPosts('post', -1, 'author');
  for (let i = 0; i < posts.length; i += 1) {
    if (author === posts[i].title) {
      authorImage = posts[i].image;
      authorName = posts[i].title;
      authorTitle = posts[i].authortitle !== '' ? posts[i].authortitle : 'Contributor';
      authorUrl = posts[i].path;
    }
  }
  const picMedia = [{ media: '(min-width: 160px)', width: '160' }];
  const pic = createOptimizedPicture(authorImage, '', false, picMedia);
  sidebar.innerHTML = `<a class="author-image" href="${authorUrl}">${pic.outerHTML}</a>
  <div class="author-details">
  <h3 class="author-name"><a href="${authorUrl}">${authorName}</a></h3>
  <h4 class="author-title">${authorTitle}</h4>
  </div>
  <div class="social">
  <span class="icon icon-facebook"></span>
  <span class="icon icon-twitter"></span>
  <span class="icon icon-linkedin"></span>
  <span class="icon icon-email"></span>
  </div>

    `;
  decorateIcons(sidebar);
}

function buildPostData(contentarea, sidebar, contentcontainer) {
  const topic = getMetadata('topic');
  const pubdate = getMetadata('publication-date');
  const readtime = getMetadata('read-time');
  contentcontainer.insertAdjacentHTML('afterbegin', `<p class='blog-category'><a href='#'>${topic}</a></p>`);
  contentcontainer.querySelector('h1').insertAdjacentHTML('afterend', `<div class='post-stats'><span class='pubdate'>${pubdate}</span>  | <span class="icon icon-clock"></span><span class='readtime'>${readtime}</span></div>`);
  contentarea.parentNode.insertBefore(sidebar, contentarea);
  decorateIcons(contentarea);
}

export default function decorate(doc) {
  const contentarea = doc.querySelector('.hero-container').nextElementSibling;
  const contentcontainer = contentarea.firstElementChild;
  const classes = ['post-sidebar'];
  const sidebar = createElement('div', classes);
  buildAuthorImage(sidebar, getMetadata('author'));
  buildPostData(contentarea, sidebar, contentcontainer);
}
