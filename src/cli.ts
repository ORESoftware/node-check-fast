#!/usr/bin/env node

import {log} from './utils';
import * as path from 'path';
const dashdash = require('dashdash');
import {ncf} from './ncf';
import  chalk from 'chalk';
import * as util from 'util';

const now = Date.now();
process.once('exit', function (code) {
  if(code > 0){
    log.warn(chalk.bold('ncf exiting with code =>'), chalk.magentaBright.bold(String(code)), 'after',
      ((Date.now() - now)/1000).toFixed(3), 'seconds.');
  }
  else{
    log.success(chalk.gray('ncf exiting with exit code =>'), chalk.cyan.bold(String(code)), 'after',
      chalk.cyan(((Date.now() - now)/1000).toFixed(3)), 'seconds.');
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
    names: ['root'],
    type: 'string',
    default: '.'
  }

];

const parser = dashdash.createParser({options});
let opts;

try {
  opts = parser.parse(process.argv);
} catch (e) {
  console.error('Opts parsing error: %s', e.message);
  process.exit(1);
}

if (opts.help) {
  const help = parser.help({includeEnv: true}).trimRight();
  console.log('usage: node-check-fast [OPTIONS]\n'
    + 'options:\n'
    + help);
  // we exit with code=1 because this does not pass any tests
  process.exit(1);
}

const cwd = process.cwd();

let root = opts.root;
if (!root) {
  log.info('warning: no "--root" option was passed at the command line');
  log.info('therefore Node-Check-Fast will use the current working directory as root.');
  root = cwd;
}
else {
  if (!path.isAbsolute(root)) {
    root = path.resolve(cwd + '/' + root);
  }
}

ncf({
    root: root,
    notPaths: opts.not_paths,
    paths: opts.paths,
    maxDepth: opts.max_depth,
    verbosity: opts.verbosity,
    concurrency: opts.concurrency
  },
  
  function (err, results) {
    
    const failures = results.filter(function (r) {
      return !(r && r.code === 0);
    });
    
    failures.forEach(function (f) {
      log.warn('code:', f.code, 'file:', f.file)
    });
    
    if (err) {
      log.error('Not all files were necessarily run, because we may have exited early.');
      log.error('Node check failed for at least one file.');
      return process.exit(1);
    }
    
    if (results.length < 1) {
      log.warn('No files matched, and no files were checked.');
      return process.exit(1);
    }
    
    if (failures.length < 1) {
      log.success(chalk.green.bold('All your process are belong to success.'));
      return process.exit(0);
    }
    
    failures.forEach(function (f) {
      log.warn('code:', f.code, 'file:', chalk.red(f.file))
    });
    
    log.error(chalk.red('At least one process exitted with a non-zero code.'));
    process.exit(1);
    
  });

