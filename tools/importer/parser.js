const fs = require('fs');

const data = fs.readFileSync('./fetchUGCProperties', { encoding: 'utf8', flag: 'r' });
let content = '';
let curContent = '';
let counter = 0;
let isDraft = false;
const regex = /^[\s]*entity_url[\s]*:[\s]*(http.*)$/;
const isDraftRegex = /^[\s]*isDraft[\s]*:[\s]*(true|false)$/;
data.split(/\r?\n/).forEach((line) => {
  if (isDraftRegex.test(line)) {
    isDraft = line.match(isDraftRegex)[1].toLocaleLowerCase() === 'true';
  }

  if (regex.test(line)) {
    if (!isDraft) {
      const url = line.match(regex);
      content += url[1].replace('http://localhost:4503', 'https://blogs.keysight.com');
      content += '\n';
      curContent += url[1].replace('http://localhost:4503', 'https://blogs.keysight.com');
      curContent += '\n';
      counter += 1;
      if (counter % 200 === 0) {
        fs.writeFileSync(`./urls-${counter}.txt`, curContent);
        curContent = '';
      }
    }
  }
});
fs.writeFileSync(`./urls-${counter}.txt`, curContent);
fs.writeFileSync('./urls-all.txt', content);
