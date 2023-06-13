import { toClassName } from './lib-franklin.js';

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
    resp = await fetch(`${origin}/blogs/tags.plain.html`);
    if (resp && resp.ok) {
      const text = await resp.text();
      const tempElement = document.createElement('div');
      tempElement.innerHTML = text;
      // Get the root <ul> element
      const rootUlElement = tempElement.querySelector('ul');
      // Create the JavaScript array from the nested <ul>
      const result = await getTags(rootUlElement);
      return result;
    }
  } catch (e) {
    // console.log('Error:', e);
  }
  return null;
}

/**
 * Validate an array of tag objects against a source.
 * @param {Array} tagObjArray The object array to validate.
 * @returns {Array} Array containing the valid tag objects.
 */
export async function validateTagObjs(tagsObjArray) {
  try {
    const allowedTags = await getFranklinTags();
    const result = [];
    tagsObjArray.forEach((obj) => {
      if (allowedTags.includes(toClassName(obj.tag))) {
        result.push(obj);
      }
    });
    return result;
  } catch (e) {
    // console.log('Error:', e);
  }
  return null;
}

/**
 * Validate an array of tag strings against a source.
 * @param {String} tagArray The string array to validate.
 * @returns {Array} Array containing two arrays. The first array being only the valid tags,
 * the second one being the tags that are invalid
 */
export async function validateTags(tagsArray) {
  try {
    const allowedTags = await getFranklinTags();
    const validTags = [];
    const invalidTags = [];
    tagsArray.forEach((tag) => {
      if (allowedTags.includes(toClassName(tag))) {
        validTags.push(tag);
      } else {
        console.warn('Tag warning:', tag); // warn for tag cleanup
        invalidTags.push(tag);
      }
    });
    return [tagsArray, invalidTags]; // return original tags for now
    // return [validTags, invalidTags];
  } catch (e) {
    // console.log('Error:', e);
  }
  return null;
}
