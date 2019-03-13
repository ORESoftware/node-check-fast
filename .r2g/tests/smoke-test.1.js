#!/usr/bin/env node
'use strict';


const assert = require('assert');
const path = require('path');
const cp = require('child_process');
const os = require('os');
const fs = require('fs');
const EE = require('events');
const {ncf} = require('@oresoftware/ncf');

process.on('unhandledRejection', (reason, p) => {
  // note: unless we force process to exit with 1, process may exit with 0 upon an unhandledRejection
  console.error(reason);
  process.exit(1);
});


const to = setTimeout(() => {
  console.error('r2g phase-T test timed out.');
  process.exit(1);
}, 4000);




ncf({
  
  root: process.cwd(),   // required: an absolute path representing where to start searching for .js files
  paths: [],             // optional: paths to match
  notPaths: [],          // optional: paths not to match
  concurrency: 8,        // optional: number of processes to run at a time
  maxDepth: 10,          // optional: max number of directories to drill into it
  verbosity: 1
  
}, function(err, results){
  
  if(err){
    throw err;
  }
  
  clearTimeout(to);
  
  assert(Array.isArray(results), 'results should be an array.');
  assert(results.length > 0, 'results should have at least one element.');
  
  process.exit(0);
  
  // if err is present, a file failed the "node -c" check.
  // results will tell you specifically which files failed
  // if results is an empty array, not files were checked/matched.
  
});

