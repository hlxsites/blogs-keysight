import { toClassName } from './lib-franklin.js';
import ffetch from './ffetch.js';

/**
 * Find the second-level list items and put them into a single array.
 * @returns {Array} An array of tag strings
 */
async function getTags(ul) {
  const tagList = ul.querySelectorAll('ul li ul li');
  const tagArray = [...tagList];
  const textArray = tagArray.map((li) => toClassName(li.textContent));
  return textArray;
}

/**
 * Retrieve HTML from tags.docx.
 * @returns {Array} An array of tag strings
 */
async function getFranklinTags() {
  let resp;
  try {
    // Fetch the HTML content of the webpage
    resp = await ffetch(`${origin}/blogs/tags.plain.html`);
    if (resp && resp.ok) {
      const text = await resp.text();
      const tempElement = document.createElement('div');
      tempElement.innerHTML = text;
      // Get the root <ul> element
      const rootUlElement = tempElement.querySelector('ul');
      // Create the JavaScript array from the nested <ul>
      const result = getTags(rootUlElement);
      return result;
    }
  } catch {
    // fail
  }
  return null;
}

/**
 * Retrieve tags from API.
 * @returns {Array} An array of tag objects
 */
async function getAEMTags() {
  let resp;
  try {
    // Fetch the HTML content of the webpage
    //resp = await ffetch(`${origin}/clientapi/search/aemtags/en`);
    resp = await ffetch(`https://www.keysight.com/clientapi/search/aemtags/en`);
    if (resp && resp.ok) {
      const json = await resp.json();
      return json;
    } else console.log(resp)
  } catch (e) {
    // fail
    console.log('Error:', e);
  }
  return null;
}

/**
 * Validate a single tag string against a source.
 * @param {String} tag The string to validate.
 * @returns {boolean}
 */
export function validateTag(tag) {

}

/**
 * Validate an array of tag strings against a source.
 * @param {String} tagArray The string array to validate.
 * @returns {Array} Array containing two arrays. The first array being only the valid tags,
 * the second one being the tags that are invalid
 */
export default async function validateTags(tagsArray) {
  let resp;
  let allowedTags;
  try {
    resp = await fetch(`https://www.keysight.com/clientapi/search/aemtags/en`);
    if (resp && resp.ok) {
      allowedTags = await resp.json();
      let validTags = [];
      let invalidTags = [];

      tagsArray.forEach((tag) => {
        
        console.log(allowedTags);

        const match = allowedTags.hits.find((item) => item.TAG_NAME === tag);
        if (match) {
          validTags.push(tag);
        } else {
          invalidTags.push(tag);
        }
      });
      return [validTags, invalidTags];
    }
  } catch (e) {
    // fail
    console.log('Error:', e);
  }
}
