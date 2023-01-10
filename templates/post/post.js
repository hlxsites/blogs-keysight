import { getMetadata } from '../../scripts/lib-franklin.js';

export default function decorate(doc) {
  const topic = getMetadata('topic');
  const hercontainer = doc.querySelectorAll('.hero-container');
  console.log(topic);
  hercontainer.insertAdjacentHTML(topic);
}
