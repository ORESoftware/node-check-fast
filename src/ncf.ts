'use strict';

import {log} from './utils';
import async = require('async');
import cp = require('child_process');
import assert = require('assert');
import os = require('os');
import path = require('path');
import util = require('util');
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

declare type NCFCallback = (err: Error | String, data: Array<CalledBackData>) => void;

//////////////////////////////////////////////////////////////////////

export const ncf = function (opts: NCFOpts, cb: NCFCallback) {
  
  const root = opts.root || process.cwd();
  assert(path.isAbsolute(root), ' => node-check-fast => Root must be an absolute path.');
  
  const paths = opts.paths || ['*.js'];
  assert(Array.isArray(paths), '  => node-check-fast => "path" must be an array.');
  
  const notPaths = opts.notPaths || ['**/node_modules/**'];
  assert(Array.isArray(notPaths), ' => node-check-fast => "notPaths" must be an array.');
  
  const maxDepth = opts.maxDepth || 12;
  assert(Number.isInteger(maxDepth), '  => node-check-fast => "maxDepth" must be an integer.');
  
  const concurrency = opts.concurrency || cpuCount;
  assert(Number.isInteger(concurrency), ' => "concurrency" option must be an integer.');
  
  ////////////////////////////////////////////////////////////////////////////////
  
  const checkAll = function (files: Array<string>, cb: NCFCallback) {
    
    async.mapLimit(files, concurrency, function (f, cb) {
      
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
        
        cb(err, {code: code, file: f});
        
      });
      
    }, cb);
    
  };
  
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
  
  k.stdin.write('\n' + cmd + '\n');
  
  process.nextTick(function () {
    k.stdin.end();
  });
  
  k.stdout.setEncoding('utf8');
  k.stderr.setEncoding('utf8');
  
  let stdout = '', stderr = '';
  
  k.stdout.on('data', function (data: string) {
    stdout += data;
  });
  
  k.stderr.on('data', function (d: string) {
    stderr += d;
  });
  
  k.once('exit', function (code: Number) {
    
    if (code > 0) {
      return cb(new Error('Error: find command failed - \n' + cmd + '\n' + stderr), []);
    }
    
    const files = String(stdout).trim().split('\n').filter(l => l);
    
    if (files.length < 1) {
      return cb(null, []);
    }
    
    checkAll(files, cb);
    
  });
  
};

export default ncf;