import rp from 'request-promise';
import download from 'image-downloader';
import { homedir } from 'os';
import { existsSync } from 'fs';
import stringHash from 'string-hash';

// const REGEX_EXPRESSION = /(JSON\.parse\('.+'\))\)\./;
const REGEX_EXPRESSION = /JSON\.parse.+?(?=\. con)/;

const IMAGE_FOLDER_DEST = `${homedir()}/Dropbox/Pictures/Chromecast`;

function fetchChromecastBodyText() {
  return rp('https://clients3.google.com/cast/chromecast/home');
}

async function getChromecastImageUrls() {
  // from https://github.com/dconnolly/chromecast-backgrounds, kind of
  const text = await fetchChromecastBodyText();
  const initParse = text.match(REGEX_EXPRESSION)[0];
  let matches;
  try {
    // eslint-disable-next-line no-eval
    matches = eval(initParse);
  } catch (err) {
    // Sometimes the regex captures an extra parens
    // eslint-disable-next-line no-eval
    matches = eval(initParse.slice(0, -1));
  }

  return matches[0].map(match => match[0]);
}

function downloadUrl(url) {
  const fileHash = stringHash(url);
  const fileName = `chromecast_image_${fileHash}.jpg`;
  const filePath = `${IMAGE_FOLDER_DEST}/${fileName}`;
  if (existsSync(filePath)) {
    return Promise.resolve().then(() => {
      // eslint-disable-next-line no-console
      console.log(`${fileName} already exists`);
    });
  }

  return download
    .image({
      url,
      dest: filePath,
    })
    .then(({ filename }) => {
      // eslint-disable-next-line no-console
      console.log(`File saved to ${filename}`);
    })
    .catch(err => {
      // eslint-disable-next-line no-console
      console.error(err);
    });
}

function parallelDownloadUrls(urls) {
  const limit = 5;
  let index;

  const onDone = () => {
    if (index >= urls.length) return;
    downloadUrl(urls[index]).then(onDone);
    // eslint-disable-next-line no-plusplus
    index++;
  };

  // eslint-disable-next-line no-plusplus
  for (index = 0; index < limit; index++) {
    downloadUrl(urls[index]).then(onDone);
  }
}

getChromecastImageUrls()
  .then(urls => {
    parallelDownloadUrls(urls);
  })
  .catch(err => {
    // eslint-disable-next-line no-console
    console.error(err);
  });
