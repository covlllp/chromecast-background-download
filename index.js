import fetch from 'node-fetch';
import download from 'image-downloader';
import { homedir } from 'os';

const REGEX_EXPRESSION = /(JSON\.parse\('.+'\))\)\./;

const IMAGE_FOLDER_DEST = `${homedir()}/Pictures`;

function fetchChromecastBodyText() {
  return fetch('https://clients3.google.com/cast/chromecast/home').then(res =>
    res.text(),
  );
}

async function getChromecastImageUrls() {
  // from https://github.com/dconnolly/chromecast-backgrounds
  const text = await fetchChromecastBodyText();
  // eslint-disable-next-line no-eval
  const matches = eval(text.match(REGEX_EXPRESSION)[1]);

  return matches[0].map(match => match[0]);
}

function downloadUrl(url, index) {
  return download
    .image({
      url,
      dest: `${IMAGE_FOLDER_DEST}/chromecast_image_${index}.jpg`,
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

getChromecastImageUrls().then(urls => {
  for (let i = 0, len = 5; i < len; i++) {
    downloadUrl(urls[i], i);
  }
});
