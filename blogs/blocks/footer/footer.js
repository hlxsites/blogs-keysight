// import { readBlockConfig, decorateIcons } from '../../scripts/lib-franklin.js';
// import { createElement } from '../../scripts/scripts.js';
import getCookie from '../../util/getCookies.js';

/**
 * loads and decorates the footer
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // const cfg = readBlockConfig(block);
  // block.textContent = '';

  // const footerPath = cfg.footer || '/blogs/footer';
  // const resp = await fetch(`${footerPath}.plain.html`);
  // const html = await resp.text();
  // const footer = createElement('div');
  // footer.innerHTML = html;
  // await decorateIcons(footer);
  // block.append(footer);
  // block.classList.add('appear');
  const cookieAgLocale = getCookie('AG_LOCALE');
  let cc;
  let lc;

  if (cookieAgLocale) {
    cc = cookieAgLocale.substring(0, 2).toLowerCase();
    lc = cookieAgLocale.substring(2, cookieAgLocale.length);
  } else {
    lc = 'en';
    cc = 'us';
  }

  let url;
  switch (lc) {
    case 'por': {
      url = 'https://stgwww.keysight.com/etc/keysight/api/headerFooterExporter.markup.json?component=footer&ctry=br&lang=pt_br';
      break;
    }
    case 'chi': {
      url = 'https://stgwww.keysight.com/etc/keysight/api/headerFooterExporter.markup.json?component=footer&ctry=cn&lang=zh_cn';
      break;
    }
    case 'cht': {
      url = 'https://stgwww.keysight.com/etc/keysight/api/headerFooterExporter.markup.json?component=footer&ctry=tw&lang=zh_tw';
      break;
    }
    case 'jpn': {
      url = 'https://stgwww.keysight.com/etc/keysight/api/headerFooterExporter.markup.json?component=footer&ctry=jp&lang=ja';
      break;
    }
    case 'kor': {
      url = 'https://stgwww.keysight.com/etc/keysight/api/headerFooterExporter.markup.json?component=footer&ctry=kr&lang=ko';
      break;
    }
    case 'rus': {
      url = 'https://stgwww.keysight.com/etc/keysight/api/headerFooterExporter.markup.json?component=footer&ctry=ru&lang=ru';
      break;
    }
    case 'ger': {
      url = 'https://stgwww.keysight.com/etc/keysight/api/headerFooterExporter.markup.json?component=footer&ctry=de&lang=de';
      break;
    }
    default:
      url = `https://stgwww.keysight.com/etc/keysight/api/headerFooterExporter.markup.json?component=footer&ctry=${cc}&lang=en`;
  }

  const markupResponse = await fetch(url);
  if (markupResponse.ok) {
    const data = await markupResponse.text();

    block.innerHTML = data;
  }
}
