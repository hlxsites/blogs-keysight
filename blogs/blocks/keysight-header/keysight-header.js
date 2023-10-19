import { loadCSS } from '../../scripts/lib-franklin.js';
import getCookie from '../../util/getCookies.js';
import { loadScript } from '../../scripts/scripts.js';

export default async function decorate(block) {
  loadScript(`${window.hlx.codeBasePath}/scripts/vendors/jquery-3.5.min.js`, 'text/javascript', () => {
  });
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
      url = '/etc/keysight/api/headerFooterExporter.markup.json?component=header&ctry=br&lang=pt_br';
      break;
    }
    case 'chi': {
      url = '/etc/keysight/api/headerFooterExporter.markup.json?component=header&ctry=cn&lang=zh_cn';
      break;
    }
    case 'cht': {
      url = '/etc/keysight/api/headerFooterExporter.markup.json?component=header&ctry=tw&lang=zh_tw';
      break;
    }
    case 'jpn': {
      url = '/etc/keysight/api/headerFooterExporter.markup.json?component=header&ctry=jp&lang=ja';
      break;
    }
    case 'kor': {
      url = '/etc/keysight/api/headerFooterExporter.markup.json?component=header&ctry=kr&lang=ko';
      break;
    }
    case 'rus': {
      url = '/etc/keysight/api/headerFooterExporter.markup.json?component=header&ctry=ru&lang=ru';
      break;
    }
    case 'ger': {
      url = '/etc/keysight/api/headerFooterExporter.markup.json?component=header&ctry=de&lang=de';
      break;
    }
    default:
      url = `/etc/keysight/api/headerFooterExporter.markup.json?component=header&ctry=${cc}&lang=en`;
  }

  const response = await fetch('/etc/keysight/api/headerFooterExporter.style.html?component=header&ctry=us&lang=en&type=css');
  if (response.ok) {
    const data2 = await response.text();
    const domParser = new DOMParser();
    const cssDoc = domParser.parseFromString(data2, 'text/html');
    cssDoc.querySelectorAll('link[href]').forEach((link) => {
      loadCSS(link.href);
    });
    const markupResponse = await fetch(url);
    if (markupResponse.ok) {
      const data = await markupResponse.text();

      block.innerHTML = data;
      const refreshLink = document.querySelectorAll('#locale-chooser div ul li a');
      const currentURL = window.location.href;
      let originalURL = null;
      let urlParts;
      const i = 0;
      let baseURL;
      if (refreshLink) {
        refreshLink.forEach((link) => {
          if (link.id !== 'language-selector-more-link') {
            link.href = window.location.href;
          } else {
            originalURL = link.href;
            urlParts = originalURL.split('?');
            baseURL = urlParts[i];
            link.href = `${baseURL}?prev_url=${currentURL}`;
          }
        });
      }
      const jsResponse = await fetch('/etc/keysight/api/headerFooterExporter.style.html?component=header&ctry=us&lang=en&type=js');
      if (jsResponse.ok) {
        const data1 = await jsResponse.text();
        const resultAfterSplitJS = data1.split('src="');
        resultAfterSplitJS.forEach((element) => {
          const src = element.split('" ')[0].split('">')[0];
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.innerHTML = '';
          script.src = src;
          document.head.appendChild(script);
        });
      }
    }
  }
}
