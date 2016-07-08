/* eslint-disable no-console */
import fs from 'fs';
import process from 'process';

import knexjs from 'knex';
import { promisifyAll } from 'bluebird';
import { chunk } from 'lodash';

import { public_posts as mysql_config } from './knexfile'

promisifyAll(fs);

let mysql;
let path;

/**
 * You first need to create a formatting function to pad numbers to two digits?
 **/
function twoDigits(d) {
  if (0 <= d && d < 10)
    return `0${d.toString()}`;

  if (-10 < d && d < 0)
    return `-0${(-1 * d).toString()}`;

  return d.toString();
}

/**
 * ?and then create the method to output the date string as desired.
 * Some people hate using prototypes this way, but if you are going
 * to apply this to more than one Date object, having it as a prototype
 * makes sense.
 **/
Date.prototype.toMysqlFormat = function () {
  const YYYY = this.getUTCFullYear();
  const MM = twoDigits(1 + this.getUTCMonth());
  const DD = twoDigits(this.getUTCDate());
  const HH = twoDigits(this.getUTCHours());
  const ii = twoDigits(this.getUTCMinutes());
  const ss = twoDigits(this.getUTCSeconds());

  return `${YYYY}-${MM}-${DD} ${HH}:${ii}:${ss}`;
};

async function processFile(fn, currentFile) {
  const rawReq = await fs.readFileAsync(path + fn);
  let req;

  try {
    req = JSON.parse(rawReq);
  } catch (e) {
    console.log(`Failed to parse file #${currentFile} (${fn})`);
    return;
  }

  if (!req || !req.posts || !req.posts.id) {
    console.log(`Incorrect data in #${currentFile} (${fn})`);
    return;
  }

  const id = req.posts.id;
  const url = `/v1/posts/${id}?maxComments=all`;

  try {
    await mysql.transaction(async(trx) => {
      await mysql.transacting(trx)
        .insert({ url, 'body': rawReq })
        .into('freefeed_urls');

      await mysql.transacting(trx)
        .insert({
          'uuid':      id,
          'body':      req.posts.body,
          'createdat': new Date(parseInt(req.posts.createdAt)).toMysqlFormat(),
          'updatedat': new Date(parseInt(req.posts.updatedAt)).toMysqlFormat()
        }).into('freefeed_posts');
    });
  } catch (e) {
    if (e.code == 'ER_DUP_ENTRY') {
      console.log(`Already imported: ${fn}`);
      return;
    }

    throw e;
  }
}

async function main() {
  path = process.argv[2];

  if (!path) {
    throw new Error('You should provide a source directory');
  }

  if (!mysql_config) {
    throw new Error('"public_posts" endpoint is not defined in knexfile');
  }

  mysql = knexjs(mysql_config);

  if (path.charAt(path.length - 1) != '/')
    path += '/';

  console.log('Started');

  let files = (await fs.readdirAsync(path))/*.filter((fn) => {
    return fn.substr(fn.lastIndexOf('.')) == '.json'
  })*/;

  const count = files.length;
  console.log(`Found ${count} json files`);

  let currentFile = 1;

  if (process.env.SKIP) {
    currentFile = process.env.SKIP;
    files = files.slice(currentFile);
    console.log('');
  }

  for (const fns of chunk(files, 10)) {
    await Promise.all(fns.map(fn => processFile(fn, currentFile++)));
  }
}

main()
  .then(() => {
    console.log('Finished');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
