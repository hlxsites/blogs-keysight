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
 * check if the tag match (check path, title, and name)
 * @param {string} tag the tag to check
 * @param {object[]} allowedTags the set of tags to check against
 * @param {boolean} [strict] indicates if matching is strict (must match path exactly) or
 * loose (matches title name or path)
 */
export function findTag(tag, allowedTags, strict = false) {
  return allowedTags.find((item) => {
    if (strict) {
      return item.TAG_PATH === `/content/cq:tags/${tag}`;
    }

    return item.TAG_NAME.toLowerCase() === tag.toLowerCase()
      || item.TAG_TITLE.toLowerCase() === tag.toLowerCase()
      || item.TAG_PATH.toLowerCase() === `/content/cq:tags/${tag.toLowerCase()}`;
  });
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
 * Validate an array of tag strings against a source.
 * Can also be used to convert an array of tag names/titles/paths to tag objects.
 *
 * @param {String[]|object[]} tagArray The tags to validate.
 * @param {String} [category] The category of tags to be returned
 * @param {String} [lang] The language of the tags to be returned
 * @param {boolean} [strict] indicates if matching is strict (must match path exactly) or
 * loose (matches title name or path)
 * @returns {Promise<Array>} Array containing two arrays. The first array being only the valid tags,
 * the second one being the tags that are invalid
 */
export async function validateTags(tagsArray, category = TAG_CATEGORY_BLOGS, lang = 'en', strict = false) {
  try {
    const allowedTags = await getAEMTags(category, lang);
    const validTags = [];
    const invalidTags = [];

    /**
     * @param {string} tag the tag name, path, or title
     */
    const isValidTag = (tag) => {
      const matchTag = findTag(tag, allowedTags, strict);
      if (matchTag) {
        validTags.push(matchTag); // put the AEM tag object in the array - to be used later
      } else {
        /* todo when we are ready to actually remove the invalid tags
          take out pushing to the valid tags (and remove the console.warn)
        */
        // eslint-disable-next-line no-console
        console.warn('Invalid Tag: ', tag); // warn for tag cleanup
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
