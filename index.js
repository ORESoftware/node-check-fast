

const async = require('async');
const cp = require('child_process');
const assert = require('assert');
const os = require('os');
const cpuCount = os.cpus().length;
const path = require('path');
const flattenDeep = require('lodash.flattendeep');

export default function(opts: any){

  const root = opts.root;
  assert(path.isAbsolute(root), ' => node-check-fast => Root must be an absolute path.');

  const notPaths = opts.notPaths || [];
  assert(Array.isArray(notPaths), ' => node-check-fast => "notPaths" must be an array.');

  const maxDepth = opts.maxDepth || 12;
  assert(Number.isInteger(maxDepth), '  => node-check-fast => "maxDepth" must be an integer.');

  const paths = opts.paths || ["*.js"];
  assert(Array.isArray(paths), '  => node-check-fast => "path" must be an array.');


  function checkAll(files){

    async.mapLimit(files, cpuCount, function(f, cb){

      process.nextTick(cb);

    }, function(err){
      console.log('all done');
    })

  }

  const base = ['find $(dirname',`${root}`,')'].join('');
  const maxD = ['-maxdepth', `${maxDepth}`].join(' ');
  const typeF = ['-type f'];

  const $path = paths.map(function(p){
      return ' -path ' + p;
  });

  const $notPath = notPaths.map(function(p){
    return ' -not -path ' + p;
  });


  const cmd = flattenDeep([base,maxDepth, typeF, $path, $notPath]).join(' ');


//   const command = 'find $(dirname "$DIR") -maxdepth 8 -type f  -path "*.js" -not -path "*/node_modules/*" \
// -not -path "*/node_modules/*" -not -path "*/babel/*" -not -path "*/examples/*"';

  console.log(cmd);


  const k = cp.spawn('bash');

  k.stdin.write('\n' + cmd  + '\n');

  process.nextTick(function(){
     k.stdin.end();
  });

  k.once('close', function(){
      if(code > 0){
        process.stderr.write('Error: find command failed - \n' + cmd);
        process.exit(1);
      }
      else{
          checkAll([]);
      }

  });









}
