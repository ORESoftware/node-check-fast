'use strict';

import {log} from './utils';
import async = require('async');
import cp = require('child_process');
import assert = require('assert');
import os = require('os');
import path = require('path');
import util = require('util');
import readline = require('readline');
import colors from 'chalk';

const flattenDeep = function (a: Array<any>): Array<any> {
  return a.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
};

//project
const cpuCount = os.cpus().length || 2;

/////////////////////////////////////////////////////////////////////

export interface NCFOpts {
  root: string,
  notPaths?: Array<string>,
  paths?: Array<string>
  maxDepth?: number,
  concurrency?: number,
  verbosity?: number
}

export interface CalledBackData {
  code: Number,
  file: string
}

declare type NCFCallback = (err?: Error | String, data?: Array<CalledBackData>) => void;

//////////////////////////////////////////////////////////////////////

export const ncf = function (opts: NCFOpts, cb: NCFCallback) {

  let root, paths, notPaths, maxDepth, concurrency;

  try {
    root = opts.root || process.cwd();
    assert(path.isAbsolute(root), ' => node-check-fast => Root must be an absolute path.');

    paths = opts.paths || ['*.js'];
    assert(Array.isArray(paths), '  => node-check-fast => "path" must be an array.');

    notPaths = opts.notPaths || ['**/node_modules/**'];
    assert(Array.isArray(notPaths), ' => node-check-fast => "notPaths" must be an array.');

    maxDepth = opts.maxDepth || 12;
    assert(Number.isInteger(maxDepth), '  => node-check-fast => "maxDepth" must be an integer.');

    concurrency = opts.concurrency || cpuCount;
    assert(Number.isInteger(concurrency), ' => "concurrency" option must be an integer.');
    log.info('using concurrency:', concurrency);
  }
  catch (err) {
    return process.nextTick(cb, err);
  }


  const results = [] as Array<any>;

  const processFile = function (f: string) {

    return function (cb: any) {

      const k = cp.spawn('bash');
      k.stdin.end(`node -c "${f}";\n`);

      k.once('exit', function (code) {

        if (code < 1 && opts.verbosity > 1) {
          log.info('The following file was processed with no syntax errors:', colors.blueBright(f));
        }

        let err = null;

        if (code > 0) {
          err = new Error('Exit code of "node -c" child process was greater than 0 for file => "' + f + '"');
        }

        results.push({code: code, file: f});

        cb(err);

      });

    }
  };


  const q = async.queue(function (task: any, cb) {
    task(cb);
  }, concurrency);

  const final = function (err?: any) {
    q.kill();
    cb(err, results);
  };

  q.drain = final;
  q.error = final;


  const $base = ['find', `${root}`].join(' ');
  const $maxD = ['-maxdepth', `${maxDepth}`].join(' ');
  const $typeF = ['-type f'];

  const $path = paths.map(function (p: String) {
    return ' -path \"' + String(p).trim() + '\" ';
  });

  const $notPath = notPaths.map(function (p: String) {
    return ' -not -path \"' + String(p).trim() + '\" ';
  });

  if (opts.verbosity > 2) {
    log.info('verbose => "--path" option contents => ', util.inspect($path));
    log.info('verbose => "--not-path" option contents => ', util.inspect($notPath));
  }

  const cmd = flattenDeep([$base, $maxD, $typeF, $path, $notPath]).join(' ');
  const k = cp.spawn('bash');

  k.stdin.end('\n' + cmd + '\n');

  k.stdout.setEncoding('utf8');
  k.stderr.setEncoding('utf8');

  let stderr = '';

  const rl = readline.createInterface({
    input: k.stdout,
  });

  rl.on('line', function (f: string) {
    q.push(processFile(f));
  });

  k.stderr.on('data', function (d: string) {
    stderr += d;
  });

  k.once('exit', function (code: Number) {

    const idle = q.idle();
    const running = q.running();

    if (code > 0) {
      return final(new Error('Error: find command failed - \n' + cmd + '\n' + stderr));
    }

    if (idle && running < 1) {
      // queue will be idle if nothing was ever pushed to it
      cb(null, results);
    }

  });

};

export default ncf;