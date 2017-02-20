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
    name: 'paths',
    type: 'arrayOfString',
    help: 'List of paths to match.'
  },
  {
    name: 'not-paths',
    type: 'arrayOfString',
    help: 'List of paths that do not match.'
  },
  {
    names: ['max-depth'],
    type: 'integer',
    help: 'Maximum depth to recurse through directories.'
  },
  {
    names: ['root'],
    type: 'string',
  },
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
  process.exit(0);
}


let root = opts.root;
if(!root){
  throw ' => node-check-fast => Root must be an absolute path.';
}

const path = require('path');
const cwd = process.cwd();

if(!path.isAbsolute(root)){
   opts.root = path.resolve(cwd + '/' + root);
}

// here we go!
// we don't pass a callback, so we will exit with the correct message and code
nfc(opts);

