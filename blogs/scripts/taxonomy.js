export const TAG_CATEGORY_BACK_OFFICE = 'segmentation';
export const TAG_CATEGORY_BLOGS = 'keysight-blogs';

/**
 * Retrieve tags from API.
 * @param {String} [category] The category of tags to be returned (keysight|segmentation)
 * @param {String} [lang] The language of the tags to be returned
 * @returns {Array} An array of tag objects
 */
export async function getAEMTags(category = TAG_CATEGORY_BLOGS, lang = 'en') {
  let resp;
  try {
    resp = await fetch(`https://www.keysight.com/clientapi/search/aemtags/${lang}`);
    if (resp && resp.ok) {
      const json = await resp.json();
      const tagObjs = json.hits.filter((entry) => entry.TAG_PATH.startsWith(`/content/cq:tags/${category ? `${category}/` : ''}`));
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
export async function getAEMTagsHierarchy(category = TAG_CATEGORY_BLOGS, lang = 'en') {
  const aemTags = await getAEMTags(category, lang);
  const tagsHierarchy = {};

  aemTags.forEach((tag) => {
    const tagPath = tag.TAG_PATH.replace('/content/cq:tags/', '');
    const tagName = tag.TAG_NAME;
    const tagTitle = tag.TAG_TITLE;

    const pathParts = tagPath.split('/');
    let workingHierarchy = tagsHierarchy;
    let workingPath = '';
    for (let i = 0; i < pathParts.length; i += 1) {
      const part = pathParts[i];
      workingPath += part;
      if (!workingHierarchy[part]) {
        workingHierarchy[part] = {
          tagPath: workingPath,
          tagName: part,
          tagTitle: part,
        };
      }
      workingHierarchy = workingHierarchy[part];
      if (i === pathParts.length - 1) {
        workingHierarchy.tagName = tagName;
        workingHierarchy.tagPath = tagPath;
        workingHierarchy.tagTitle = tagTitle;
      }
      workingPath += '/';
    }
  });

  return tagsHierarchy;
}

/**
 * Validate an array of tag strings against a source.
 * @param {String[]|object[]} tagArray The tags to validate.
 * @param {String} [category] The category of tags to be returned (keysight|segmentation)
 * @param {String} [lang] The language of the tags to be returned
 * @returns {Array} Array containing two arrays. The first array being only the valid tags,
 * the second one being the tags that are invalid
 */
export async function validateTags(tagsArray, category = TAG_CATEGORY_BLOGS, lang = 'en') {
  try {
    // const allowedTags = await getFranklinTags();
    const allowedTags = await getAEMTags(category, lang);
    const validTags = [];
    const invalidTags = [];

    /**
     * @param {string} tag the tag name, path, or title
     */
    const isValidTag = (tag) => {
      const matchTag = allowedTags.find((item) => item.TAG_NAME.toLowerCase() === tag.toLowerCase() || item.TAG_TITLE.toLowerCase() === tag.toLowerCase() || item.TAG_PATH.toLowerCase() === `/content/cq:tags/${tag.toLowerCase()}`);
      if (matchTag) {
        validTags.push(matchTag); // put the AEM tag object in the array - to be used later
      } else {
        /* todo when we are ready to actually remove the invalid tags
          take out pushing to the valid tags (and maybe remove the console.warn)
        */
        // eslint-disable-next-line no-console
        console.warn('Invalid Tag:', tag); // warn for tag cleanup
        validTags.push({
          TAG_NAME: tag,
          TAG_TITLE: tag,
          TAG_PATH: `/content/cq:tags/${tag}`,
        });
        invalidTags.push(tag);
      }
    };

    tagsArray.forEach((element) => {
      if (typeof element === 'string') {
        isValidTag(element);
      } else if (typeof element === 'object' && element.tag) {
        isValidTag(element.tag);
      }
    });
    return [validTags, invalidTags]; // return original tagsArray for now instead of validTags
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Error:', e);
  }
  return null;
}
