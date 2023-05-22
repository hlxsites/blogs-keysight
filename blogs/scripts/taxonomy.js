import { toClassName } from './lib-franklin.js';

async function getTags(ul) {
  const tagList = ul.querySelectorAll('ul li ul li');
  const tagArray = [...tagList];
  const textArray = tagArray.map(li => toClassName(li.textContent));
  return textArray;
}

export async function getTaxonomy() {
  let resp;
  try {
    // Fetch the HTML content of the webpage  
    resp = await fetch(`${origin}/blogs/tags.plain.html`);
    if (resp && resp.ok) {
      const text = await resp.text();
      const tempElement = document.createElement('div');
      tempElement.innerHTML = text;
      // Get the root <ul> element
      const rootUlElement = tempElement.querySelector('ul');
      // Create the JavaScript object from the nested <ul>
      const result = getTags(rootUlElement);

      console.log(result);
      return result;
    }
  }
  catch {
    // fail
  }
}
