import fetch from 'node-fetch';
import download from 'image-downloader';
import { homedir } from 'os';
import stringHash from 'string-hash';

// const REGEX_EXPRESSION = /(JSON\.parse\('.+'\))\)\./;
const REGEX_EXPRESSION = /JSON\.parse.+?(?=\. con)/;

const IMAGE_FOLDER_DEST = `${homedir()}/Pictures`;

function fetchChromecastBodyText() {
  return fetch('https://clients3.google.com/cast/chromecast/home').then(res =>
    res.text(),
  );
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
  return download
    .image({
      url,
      dest: `${IMAGE_FOLDER_DEST}/chromecast_image_${fileHash}.jpg`,
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
