
# @oresoftware/ncf (Node Check Fast)

[![Version](https://img.shields.io/npm/v/@oresoftware/ncf.svg?colorB=green)](https://www.npmjs.com/package/@oresoftware/ncf)


>
> Running `node -c` for all the files in your project can take a minute.
> This project does what it says - use the node.js interface, or the command line interface.
>

### Installation

>
> Local (for programmatic usage)
> ``` npm install -D '@oresoftware/ncf' ```
>
> Global (for command line tools, this makes more sense usually)
> ``` npm install -g '@oresoftware/ncf' ```
>

### In the beginning:

```bash
find -path "*.js" -type f -not -path "**/node_modules/**" | ncf --stdin
```

Yeah don't do that. We can use sane defaults instead.
Instead do this:

```bash
 ncf -c 9    # by default we search with the above settings
```

## Programmatic usage with Node.js:

```js

import ncf from '@oresoftware/ncf';

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
ncf --dir . --not-paths=**/test/** --not-paths=**/node_modules/** --verbosity 3 --concurrency=8
```

the terse version of the above is:

```bash
ncf -d . --np=**/test/** --np=**/node_modules/** --v 3 -c 8
```




