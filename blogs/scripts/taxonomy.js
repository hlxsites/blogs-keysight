import { toClassName } from './lib-franklin.js';

/**
 * Retrieve tags from API.
 * @param {String} [category] The category of tags to be returned (keysight|segmentation)
 * @param {String} [lang] The language of the tags to be returned
 * @returns {Array} An array of tag objects
 */
export async function getAEMTags(category = 'keysight', lang = 'en') {
  let resp;
  try {
    resp = await fetch(`https://www.keysight.com/clientapi/search/aemtags/${lang}`);
    if (resp && resp.ok) {
      const json = await resp.json();
      const tagObjs = json.hits.filter((entry) => entry.TAG_PATH.startsWith(`/content/cq:tags/${category}/`));
      return tagObjs;
    }
  } catch (e) {
    // console.log('Error:', e);
  }
  return null;
}

/**
 * Retrieve tags from API as a hierarchical object
 * @param {String} [category] The category of tags to be returned (keysight|segmentation)
 * @param {String} [lang] The language of the tags to be returned
 * @returns {Object} hierarchical object of all tags
 */
export async function getAEMTagsHierarchy(category = 'keysight', lang = 'en') {
  const aemTags = await getAEMTags(category, lang);
  const tagsHierarchy = {};

  aemTags.forEach((tag) => {
    const tagPath = tag.TAG_PATH.replace(`/content/cq:tags/${category}/`, '');
    const tagName = tag.TAG_NAME;
    const tagTitle = tag.TAG_TITLE;

    const pathParts = tagPath.split('/');
    let workingHierarchy = tagsHierarchy;
    for (let i = 0; i < pathParts.length; i += 1) {
      const part = pathParts[i];
      if (!workingHierarchy[part]) {
        workingHierarchy[part] = {};
      }
      workingHierarchy = workingHierarchy[part];
    }
    workingHierarchy = {
      ...workingHierarchy,
      tagPath,
      tagName,
      tagTitle,
    };
  });

  return tagsHierarchy;
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
