#!/usr/bin/env node

import {log} from './utils';
import * as path from 'path';
import readline = require('readline');

const dashdash = require('dashdash');
import {ncf} from './ncf';
import chalk from 'chalk';
import * as util from 'util';
import {handleResults} from "./handle-results";
import {makeProcessFile} from "./process-files";
import async = require('async');

const now = Date.now();
process.once('exit', function (code) {
  if (code > 0) {
    log.warn(chalk.bold('ncf exiting with code =>'), chalk.magentaBright.bold(String(code)), 'after',
      ((Date.now() - now) / 1000).toFixed(3), 'seconds.');
  }
  else {
    log.success(chalk.gray('ncf exiting with exit code =>'), chalk.cyan.bold(String(code)), 'after',
      chalk.cyan(((Date.now() - now) / 1000).toFixed(3)), 'seconds.');
  }
});

const options = [
  {
    names: ['help', 'h'],
    type: 'bool',
    help: 'Print help menu and exit.'
  },
  {
    names: ['paths', 'p'],
    type: 'arrayOfString',
    help: 'List of paths to match.'
  },
  {
    names: ['not-paths', 'np'],
    type: 'arrayOfString',
    help: 'List of paths that do not match.'
  },
  {
    names: ['verbosity', 'v'],
    type: 'integer',
    help: 'Choose a verbosity level, {1,2,3} - higher the number the more verbose, default is 2.',
    default: 2
  },
  {
    names: ['max-depth'],
    type: 'integer',
    help: 'Maximum depth to recurse through directories.',
    default: 12
  },
  {
    names: ['concurrency', 'c'],
    type: 'integer',
    default: 6
  },
  {
    names: ['stdin', 's'],
    type: 'bool',
    help: 'Read from stdin.'
  },
  {
    names: ['root','dir','d'],
    type: 'string',
    default: '.'
  }

];

const parser = dashdash.createParser({options});
let opts;

try {
  opts = parser.parse(process.argv);
} catch (e) {
  console.error('Opts parsing error:', e.message);
  process.exit(1);
}

if (opts.help) {
  const help = parser.help({includeEnv: true}).trimRight();
  console.log('usage: ncf [OPTIONS]\n' + 'options:\n' + help);
  process.exit(1);
}

const cwd = process.cwd();

let root = opts.root;
if (!root) {
  log.info('warning: no "--root" option was passed at the command line');
  log.info('therefore ncf will use the current working directory as root.');
  root = cwd;
}
else {
  if (!path.isAbsolute(root)) {
    root = path.resolve(cwd + '/' + root);
  }
}

if (opts.stdin) {

  const rl = readline.createInterface({
    input: process.stdin
  });

  const c = opts.concurrency || 6;
  const results = [] as Array<any>;
  const q = async.queue((task: any, cb) => task(cb), c);
  const processFile = makeProcessFile(results, opts);

  rl.on('line', function (f) {
    q.push(processFile(String(f)));
  });

  let closed = false;
  rl.on('close',  () => {
    closed = true;
  });

  let first = true;
  q.drain = q.error = function (err?: any) {

    if (err && first) {
      first = false;
      q.kill();
      handleResults(err, results);
    }
    else if (first && closed) {
      // note: if drain is called before closed is true, we aren't ready to exit yet
      handleResults(err, results);
    }

    first = false;
  };


}
else {

  ncf({
      root: root,
      notPaths: opts.not_paths,
      paths: opts.paths,
      maxDepth: opts.max_depth,
      verbosity: opts.verbosity,
      concurrency: opts.concurrency
    },
    handleResults
  );


}



