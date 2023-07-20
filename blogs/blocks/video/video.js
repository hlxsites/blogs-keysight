/*
 * Video Block
 * Show a video referenced by a link
 * https://www.hlx.live/developer/block-collection/video
 */
/* global Keysight, _elqQ */
import { createElement, loadScript } from '../../scripts/scripts.js';

let videoIdx = '0';

async function blindSend(qstrParams) {
  const elqurl = 'https://connectlp.keysight.com/e/f2.aspx';

  const fullUrlParams = {
    ...qstrParams,
    elqFormName: 'AEMBlindformtesting',
    elqSiteID: Keysight.EloquaSiteID,
    evsrcobj: 'VideoPlayer',
    evsrcpg: window.location.href,
  };
  const usp = new URLSearchParams(fullUrlParams);
  const fullelqurl = `${elqurl}?${usp}`;
  // fetch(fullelqurl);
  const resp = await fetch(fullelqurl);
  const text = await resp.text();
  // eslint-disable-next-line no-console
  console.debug(text);
}

function getCookieValue(name) {
  const cookies = decodeURIComponent(document.cookie);
  let cookieVal = '';
  cookies.split(';').forEach((cookie) => {
    const c = cookie.trim();
    if (c.indexOf(name) === 0) {
      cookieVal = c.substring(name.length + 1, c.length);
    }
  });

  return cookieVal;
}

function playerReady(id, block) {
  // eslint-disable-next-line no-undef
  const player = videojs(id);
  block.classList.add('video-loaded');
  player.ready(() => {
    const tracks = player.textTracks();
    // eslint-disable-next-line no-underscore-dangle
    const activetrack = tracks.tracks_.find((track) => track.mode === 'showing');
    if (activetrack) {
      const activetracklang = activetrack.language;
      const trackpreflang = localStorage.getItem('vtracklang');
      if (trackpreflang && activetracklang !== trackpreflang) {
        activetrack.mode = 'disabled';
        // eslint-disable-next-line no-underscore-dangle
        if (tracks.tracks_.find((track) => track.language === trackpreflang)) {
          // eslint-disable-next-line no-underscore-dangle
          tracks.tracks_.find((track) => track.language === trackpreflang).mode = 'showing';
        }
      }
      tracks.onchange = () => {
        // eslint-disable-next-line no-underscore-dangle
        const newactivetrack = tracks.tracks_.find((track) => track.mode === 'showing');
        if (newactivetrack) {
          localStorage.setItem('vtracklang', newactivetrack.language);
        }
      };
    }
  });

  const localeCookie = getCookieValue('AG_LOCALE');
  let localeCookieLanguageCode = 'en';
  if (localeCookie !== '' && localeCookie != null) {
    localeCookieLanguageCode = localeCookie.substring(2, localeCookie.length);
  }

  player.ready(() => {
    player.on('loadedmetadata', () => {
      let trackLanguage;
      const audioTracks = player.audioTracks();
      for (let i = 0; i < audioTracks.length; i += 1) {
        trackLanguage = audioTracks[i].language.substr(0, 2);
        if (trackLanguage) {
          if (trackLanguage === localeCookieLanguageCode) {
            audioTracks[i].enabled = true;
          }
        }
      }
    });
  });

  player.ready(() => {
    const srcpath = player.src();
    let elqguid = '';
    const elqCookie = getCookieValue('ELOQUA');
    if (elqCookie) {
      elqCookie.split('&').forEach((item) => {
        if (item.startsWith('GUID=')) {
          // eslint-disable-next-line prefer-destructuring
          elqguid = item.split('=')[1];
        }
      });
    }
    const qstrParams = {
      evsrcastpth: srcpath,
      guid: elqguid,
      email: 'noreply@keysight.com',
    };
    if ((Keysight.elq_u_email && Keysight.elq_u_email.length !== 0)) {
      qstrParams.email = Keysight.elq_u_email;
    }

    player.on('pause', () => {
      if (!player.seeking()) {
        blindSend({
          ...qstrParams,
          evcurplaytime: Math.floor(player.currentTime()),
          evname: 'pause',
        });
      }
    });
    player.on('play', () => {
      if (!player.seeking()) {
        blindSend({
          ...qstrParams,
          evcurplaytime: Math.floor(player.currentTime()),
          evname: 'play',
        });
      }
    });
    player.on('seeked', () => {
      blindSend({
        ...qstrParams,
        evcurplaytime: Math.floor(player.currentTime()),
        evname: 'skipto',
      });
    });
    player.on('ended', () => {
      blindSend({
        ...qstrParams,
        evcurplaytime: Math.floor(player.currentTime()),
        evname: 'end',
      });
    });
    let stop25 = false;
    let stop50 = false;
    let stop75 = false;
    player.on('timeupdate', () => {
      const curTime = Math.floor(player.currentTime());
      const duration = Math.floor(player.duration());
      const pct = curTime / duration;
      if (!stop25 && pct > 0.25) {
        stop25 = true;
        blindSend({
          ...qstrParams,
          evcurplaytime: Math.floor(player.currentTime()),
          evname: 'watch25',
        });
      }
      if (!stop50 && pct > 0.5) {
        stop50 = true;
        blindSend({
          ...qstrParams,
          evcurplaytime: Math.floor(player.currentTime()),
          evname: 'watch50',
        });
      }
      if (!stop75 && pct > 0.75) {
        stop75 = true;
        blindSend({
          ...qstrParams,
          evcurplaytime: Math.floor(player.currentTime()),
          evname: 'watch75',
        });
      }
    });
  });
}

async function renderVideo(block, source, pic) {
  videoIdx += 1;
  let preload = 'auto';
  let poster = '';
  if (pic) {
    preload = 'none';
    const img = pic.querySelector('img');
    poster = img.currentSrc || img.src;
  }

  const playerSetup = {
    controls: true,
    fluid: true,
    preload,
    playsinline: 'playsinline',
    playbackRates: [0.5, 1, 1.5, 2],
    autoplay: false,
    muted: false,
    poster,
    audioOnlyMode: false,
    liveui: false,
    loop: false,
    id: '',
    techCanOverridePoster: false,
    textTrackSettings: false,
    sources: [{
      src: source,
      type: `video/${source.split('.').pop()}`,
    }],
    plugins: {},
    html5: {
      nativeTextTracks: false,
      nativeAudioTracks: false,
      nativeVideoTracks: false,
      vhs: {
        overrideNative: true,
      },
    },
  };

  const videoAttrs = {
    id: `video-${videoIdx}`,
    'data-roundedCorner': 'custom-rounded-corner',
    'data-type': 'v',
    'data-location': 'Video Player Component',
    'data-comp': 'Keysight Video Player',
    'data-name': 'Keysight Video Player',
    'data-asset-type': 'videos',
    'data-setup': JSON.stringify(playerSetup),
  };

  const vid = createElement('video', [
    'custom-rounded-corner',
    'dtxLink',
    'dtmData',
    'video-js',
    'vjs-default-skin',
    'vjs-big-play-centered',
    'vjs-fluid',
  ], videoAttrs);
  block.append(vid);

  // fetch(`${source}/_jcr_content/metadata.json`).then((resp) => {
  //   if (resp.ok) {
  //     resp.json().then((json) => {
  //       vid.dataset.value = json['dc:title'];
  //       vid.dataset.description = json['dc:description'];
  //       vid.dataset['pub-key'] = json['ks:pubKey'];
  //       vid.dataset['pub-number'] = `${json['ks:pubKey']}.${json['ks:pubSuffix']}`;
  //       vid.dataset['pub-date'] = json['ks:pubDate']; // 2022.08.08"
  //       vid.dataset['content-type-name'] = json['ks:contentTypeName'];
  //     });
  //   }
  // });

  if (typeof videojs === 'function') {
    playerReady(`video-${videoIdx}`, block);
  } else {
    loadScript(`${window.hlx.codeBasePath}/blocks/video/videojs/video-8.3.0.min.js`, 'text/javascript', () => {
      playerReady(`video-${videoIdx}`, block);
    });
  }
}

export default async function decorate(block) {
  loadScript(`${window.hlx.codeBasePath}/blocks/video/video-globals.js`, 'text/javascript', () => {
    loadScript(Keysight.EloquaScript, 'text/javascript', () => {
      _elqQ.push(['elqDataLookup', escape(Keysight.LookupIdVisitor), '']);
    });
  });

  const a = block.querySelector('a');
  if (a) {
    const source = a.href;
    const pic = block.querySelector('picture');
    block.innerHTML = '';

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        renderVideo(block, source, pic);
      }
    });
    observer.observe(block);
  }
}
