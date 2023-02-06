import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';

const PORT = 80;
const HOST = '0.0.0.0';

const CONFIG = JSON.parse(fs.readFileSync('./src/config.json', 'utf8'));


const app = express();
app.get('/:user/:password.ics', handleRequest);

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);


async function handleRequest(req, res) {
  let password = req.params.password;
  let user = req.params.user;
  let urls = CONFIG.calendars[user];

  if(password !== CONFIG.password || !urls) {
    res.status(404).send('Not found.');
    return;
  }

  let promises = Object.entries(urls).map(async ([prefix, url]) => {
    let res = await fetch(url);
    let text = await res.text();
    let contents = getContents(text, prefix);
    return contents;
  });
  let allContents = await Promise.all(promises);

  let result = allContents[0].header;
  allContents.forEach(contents => {
    result = result.concat(...contents.events);
  });
  result = result.concat(allContents[allContents.length - 1].footer);

  res.send(result.join('\r\n'));
  console.log('Done');
}


function getContents(text, prefix) {
  let lines = text
    .split('\r\n')
    .map(line => {
      if(prefix && line.startsWith('SUMMARY:')) {
        line = `SUMMARY:(${prefix}) ${line.slice('SUMMARY:'.length)}`;
      }
      line = line.replace('TZID=Romance Standard Time', 'TZID=Europe/Brussels')
      return line;
    });

  let parts = [];
  let index = lines.indexOf('BEGIN:VEVENT') - 1;
  while(index !== -1) {
    parts.push(lines.slice(0, index + 1));
    lines.splice(0, index + 1);
    index = lines.indexOf('END:VEVENT');
  }
  parts.push(lines);

  return {
    header: parts[0],
    events: parts.slice(1, parts.length - 1),
    footer: parts[parts.length - 1],
  };
}
