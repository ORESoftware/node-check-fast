

# node-check-fast

This module is designed to be used as part of test suites for Node.js libraries.
Running node -c for all the files in your project can take a minute.

This project does what it says - use the node.js interface or the command line interface.

## Installation

## Local
#### ``` npm install -D node-check-fast ```

## Global (for command line tools)
#### ``` npm install -g node-check-fast ```


## Programmatic usage with Node.js:

```js

import ncf from 'node-check-fast';

ncf({
  
  root: process.cwd(),   // required: an absolute path representing where to start searching for .js files
  paths: [],             // optional: paths to match
  notPaths: [],          // optional: paths not to match
  concurrency: 8,        // optional: number of processes to run at a time
  maxDepth: 10,          // optional: max number of directories to drill into it
  verbosity: 1
  
}, function(err, results){
    
  // if err is present, a file failed the "node -c" check.
  // results will tell you specifically which files failed
  // if results is an empty array, not files were checked/matched.
  
})

```

Default values used for both command line and JS usage:

```
  root: process.cwd(),   
  paths: ['*.js'],             
  notPaths: ['**/node_modules/**'],        
  concurrency: os.cpus().length || 6,
  maxDepth: 12,          
  verbosity: 2

```


## Command line interface:

```bash
ncf --root . --not-paths=**/test/** --not-paths=**/node_modules/** --verbosity 3 --concurrency=8
```

the terse version of the above is:

```bash
ncf --root . --np=**/test/** --np=**/node_modules/** --v 3 -c 8
```




