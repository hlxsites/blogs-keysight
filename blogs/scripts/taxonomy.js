import { toClassName } from './lib-franklin.js';

/**
 * Retrieve tags from API.
 * @param {String} [category] The category of tags to be returned (keysight|segmentation)
 * @param {String} [lang] The language of the tags to be returned
 * @returns {Array} An array of tag objects
 */
async function getAEMTags(category = 'keysight', lang = 'en') {
  let resp;
  try {
    resp = await fetch(`https://www.keysight.com/clientapi/search/aemtags/${lang}`);
    if (resp && resp.ok) {
      const json = await resp.json();
      const tagObjs = json.hits.filter((entry) => entry.TAG_PATH.includes(`/${category}/`));
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
export default async function validateTags(tagsArray) {
  try {
    // const allowedTags = await getFranklinTags();
    const allowedTags = await getAEMTags();
    const validTags = [];
    const invalidTags = [];
    tagsArray.forEach((element) => {
      if (typeof tagsArray[0] === 'string') {
        const matchTag = allowedTags.find((item) => item.TAG_NAME === element);
        if (matchTag) {
          validTags.push(matchTag); // put the AEM tag object in the array - to be used later
        } else {
          console.warn('Tag warning:', element); // warn for tag cleanup
          invalidTags.push(element);
        }
      } else if (typeof tagsArray[0] === 'object') {
        const matchObj = allowedTags.find((item) => item.TAG_NAME === toClassName(element.tag));
        if (matchObj) {
          validTags.push(matchObj); // put the AEM tag object in the array - to be used later
        } else {
          console.warn('Tag warning:', element); // warn for tag cleanup
          invalidTags.push(element);
        }
      }
    });
    return [tagsArray, invalidTags]; // return original tagsArray for now instead of validTags
  } catch (e) {
    // console.log('Error:', e);
  }
  return null;
}
