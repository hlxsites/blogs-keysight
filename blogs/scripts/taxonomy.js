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
 * Retrieve tags from API.
 * @param {String} [category] The category of tags to be returned (keysight|segmentation)
 * @param {String} [lang] The language of the tags to be returned
 * @returns {Array} An array of tag objects
 */
async function getAEMTags(category, lang) {
  let resp;
  if (category === undefined) category = 'keysight';
  if (lang === undefined) lang = 'en';
  try {
    resp = await fetch(`https://www.keysight.com/clientapi/search/aemtags/${lang}`);
    if (resp && resp.ok) {
      const json = await resp.json();
      const tagObjs = json.hits.filter((entry) => entry.TAG_PATH.contains(`/${category}/`));
      console.log('Tags:', tagObjs);
      return tagObjs;
    }
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
    // const allowedTags = await getFranklinTags();
    const allowedTags = await getAEMTags();
    const validTags = [];
    const invalidTags = [];
    tagsArray.forEach((element) => {
      if (typeof tagsArray[0] === 'string') {
        const matchTag = allowedTags.find((item) => item.TAG_NAME === element);
        if (matchTag) {
          validTags.push(matchTag);
        } else {
          console.warn('Tag warning:', element); // warn for tag cleanup
          invalidTags.push(element);
        }
      } else if (typeof tagsArray[0] === 'object') {
        const matchObj = allowedTags.find((item) => item.TAG_NAME === toClassName(element.tag));
        if (matchObj) {
          validTags.push(matchObj);
        } else {
          console.warn('Tag warning:', element); // warn for tag cleanup
          invalidTags.push(element);
        }
      }
    });
    return [tagsArray, invalidTags]; // return original tags for now
    // return [validTags, invalidTags];
  } catch (e) {
    // console.log('Error:', e);
  }
  return null;
}
