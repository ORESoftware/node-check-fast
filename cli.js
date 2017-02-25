#!/usr/bin/env node

process.once('exit', function(code){
    if(code > 0){
      console.log(' => node-check-fast exiting with code => ', code);
    }
});

const dashdash = require('dashdash');
const nfc = require(__dirname);

const options = [
  {
    names: ['help', 'h'],
    type: 'bool',
    help: 'Print help menu and exit.'
  },
  {
    names: ['paths','p'],
    type: 'arrayOfString',
    help: 'List of paths to match.'
  },
  {
    names: ['not-paths','np'],
    type: 'arrayOfString',
    help: 'List of paths that do not match.'
  },
  {
    names: ['verbosity','v'],
    type: 'integer',
    help: 'Choose a verbosity level, {1,2,3} - higher the number the more verbose, default is 2.'
  },
  {
    names: ['max-depth','md'],
    type: 'integer',
    help: 'Maximum depth to recurse through directories.'
  },
  {
    names: ['concurrency','c'],
    type: 'integer'
  },
  {
    names: ['root','rt'],
    type: 'string'
  }

];


const parser = dashdash.createParser({options});
let opts;

try {
   opts = parser.parse(process.argv);
} catch (e) {
  console.error('Opts parsing error: %s', e.message);
  return process.exit(1);
}

if (opts.help) {
  const help = parser.help({includeEnv: true}).trimRight();
  console.log('usage: node-check-fast [OPTIONS]\n'
    + 'options:\n'
    + help);
  // we exit with code=1 because this does not pass any tests
  return process.exit(1);
}

const path = require('path');
const cwd = process.cwd();

let root = opts.root;
if(!root){
  console.log(' => Warning - no "--root" option was passed at the command line - \n' +
    'therefore Node-Check-Fast will use the current working directory as root.');
   root = cwd;
}
else{
  if(!path.isAbsolute(root)){
    root = path.resolve(cwd + '/' + root);
  }
}



// here we go!
// we don't pass a callback, so we will exit with the correct message and code
nfc({
  root: root,
  notPaths: opts.not_paths,
  paths: opts.paths,
  maxDepth: opts.max_depth,
  verbosity: opts.verbosity,
  concurrency: opts.concurrency
});

