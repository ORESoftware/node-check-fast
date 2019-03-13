'use strict';

//core
import cp = require('child_process');
import assert = require('assert');
import os = require('os');
import path = require('path');
import util = require('util');
import readline = require('readline');

//npm
import chalk from 'chalk';

//project
import {makeProcessFile} from "./process-files";
import log from './utils';
import async = require('async');
import {handleResults} from "./handle-results";


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

declare type NCFCallback = (err: any, data?: Array<CalledBackData>) => void;


export const r2gSmokeTest = async function(){
  return true;
};

export const ncf = function (opts: NCFOpts, cb: NCFCallback) {

  let root, paths, notPaths, maxDepth, c;

  try {
    root = opts.root || process.cwd();
    assert(path.isAbsolute(root), ' => node-check-fast => Root must be an absolute path.');

    paths = opts.paths || ['*.js'];
    assert(Array.isArray(paths), '  => node-check-fast => "path" must be an array.');
    
    if(paths.length < 1){
      paths.push('*.js');
    }

    notPaths = opts.notPaths || ['**/node_modules/**'];
    assert(Array.isArray(notPaths), ' => node-check-fast => "notPaths" must be an array.');
    
    if(notPaths.length < 1){
      notPaths.push('**/node_modules/**');
    }

    maxDepth = opts.maxDepth || 12;
    assert(Number.isInteger(maxDepth), '  => node-check-fast => "maxDepth" must be an integer.');

    c = opts.concurrency || cpuCount;
    assert(Number.isInteger(c), ' => "concurrency" option must be an integer.');
    log.info('using concurrency:', c);
  }
  catch (err) {
    return process.nextTick(cb, err);
  }

  const results = [] as Array<any>;
  const q = async.queue((task: any, cb) => task(cb), c);
  const processFile = makeProcessFile(results, opts);

  let first = true, closed = false;
  const final = q.drain = q.error = function (err?: any) {

    if (err && first) {
      first = false;
      q.kill();
      handleResults(err, results);
    }
    else if (first && closed) {
      handleResults(err, results);
    }

    first = false;
  };

  const $base = ['find', `"${root}"`].join(' ');
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

  k.stdin.end(cmd);
  k.stdout.setEncoding('utf8');
  k.stderr.setEncoding('utf8');

  let stderr = '';

  const rl = readline.createInterface({
    input: k.stdout,
  });

  rl.on('line', function (f: string) {
    q.push(processFile(f));
  });

  rl.once('close', function(){
    closed = true;
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