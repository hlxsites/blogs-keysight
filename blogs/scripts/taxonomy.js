export const TAG_CATEGORY_BACK_OFFICE = 'segmentation';
export const TAG_CATEGORY_BLOGS = 'keysight-blogs/hashtag';

const tagsPromises = {};
/**
 * Retrieve tags from API.
 * @param {String} [category] The category of tags to be returned (keysight|segmentation)
 * @param {String} [lang] The language of the tags to be returned
 * @returns {Promise<Array>} An array of tag objects
 */
export async function getAEMTags(category = TAG_CATEGORY_BLOGS, lang = 'en') {
  const key = `${category} - ${lang}`;
  if (!tagsPromises[key]) {
    const fetcher = async () => {
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
      return [];
    };
    tagsPromises[key] = fetcher();
  }

  return tagsPromises[key];
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
    // remove /content/cq:tags/category from tag path
    const tagPath = tag.TAG_PATH.split('/').slice(4).join('/');
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
 *
 * @param {String[]} tagsArray the tag paths to validate
 * @param {string} lang the language
 * @returns {Promise<Array>} Array containing two arrays. The first array being only the valid tags,
 * the second one being the tags that are invalid
 */
export async function validateBackOfficeTags(tagsArray, lang = 'en') {
  const allowedTags = await getAEMTags(TAG_CATEGORY_BACK_OFFICE, lang);
  const validTags = [];
  const invalidTags = [];

  tagsArray.forEach((tagPath) => {
    const foundTag = allowedTags.find((t) => t.TAG_PATH === `/content/cq:tags/segmentation/${tagPath}`);
    if (foundTag) {
      validTags.push(foundTag);
    } else {
      invalidTags.push(tagPath);
    }
  });
  return [validTags, invalidTags];
}

/**
 * Check if a tag path or title exists in a set of tag objects
 * @param {String} tagPathOrTitle a tag path or tittle
 * @param {Array<Object>} tagObjects a set of hashtag objects,
 * containing at least a tag title, and possibly a path as well
 * @returns {Object|undefined} the found tag object
 */
export function checkTag(tagPathOrTitle, tagObjects) {
  const found = tagObjects.find((tag) => {
    const pathMatch = tag.TAG_PATH ? tag.TAG_PATH === `/content/cq:tags/keysight-blogs/${tagPathOrTitle}` : false;
    const titleMatch = tag.TAG_TITLE
      ? tag.TAG_TITLE.toLowerCase() === tagPathOrTitle.toLowerCase() : false;
    const nameMatch = tag.TAG_NAME
      ? tag.TAG_NAME.toLowerCase() === tagPathOrTitle.toLowerCase() : false;

    return pathMatch || titleMatch || nameMatch;
  });

  return found;
}

/**
 * Validate an array of tag strings against a source.
 * Can also be used to convert an array of tag names/titles/paths to tag objects.
 *
 * @param {String[]} tagArray The tags to validate.
 * @param {String} [lang] The language of the tags to be returned
 * @returns {Promise<Array>} Array containing two arrays. The first array being only the valid tags,
 * the second one being the tags that are invalid
 */
export async function validateHashTags(tagsArray, lang = 'en') {
  try {
    const allowedTags = await getAEMTags(TAG_CATEGORY_BLOGS, lang);
    const validTags = [];
    const invalidTags = [];

    tagsArray.forEach((tag) => {
      const foundTag = checkTag(tag, allowedTags);
      if (foundTag) {
        validTags.push(foundTag);
      } else {
        // todo for now, no hashtags are ever considered invalid
        // in the future, remove this
        validTags.push({ TAG_TITLE: tag });
        invalidTags.push({ TAG_TITLE: tag });
      }
    });
    return [validTags, invalidTags]; // return original tagsArray for now instead of validTags
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Error:', e);
  }
  return null;
}
