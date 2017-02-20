//core
const async = require('async');
const cp = require('child_process');
const assert = require('assert');
const os = require('os');
const path = require('path');
const util = require('util');

//npm
const flattenDeep = require('lodash.flattendeep');

//project
const cpuCount = os.cpus().length || 2;

/////////////////////////////////////////////////////////////////////

interface NCFOpts {
  root: string,
  notPaths?: Array<string>,
  paths?: Array<string>
  maxDepth?: number,
  concurrency?: number,
  verbose: boolean
}

interface CalledBackData {
  code: Number,
  file: string
}


declare type Callback = (err: Error | String, data: Array<CalledBackData>) => void;

//////////////////////////////////////////////////////////////////////

export = function (opts: NCFOpts, cb: Callback) {

  const root = opts.root || '';
  assert(path.isAbsolute(root), ' => node-check-fast => Root must be an absolute path.');

  const notPaths = opts.notPaths || ['**/node_modules/**'];
  assert(Array.isArray(notPaths), ' => node-check-fast => "notPaths" must be an array.');

  const maxDepth = opts.maxDepth || 12;
  assert(Number.isInteger(maxDepth), '  => node-check-fast => "maxDepth" must be an integer.');

  const paths = opts.paths || ['*.js'];
  assert(Array.isArray(paths), '  => node-check-fast => "path" must be an array.');

  const concurrency = opts.concurrency || cpuCount;
  assert(Number.isInteger(concurrency), ' => "concurrency" option must be an integer.');


  function checkAll(files: Array<string>) {

    async.mapLimit(files, concurrency, function (f: String, cb: Function) {

      const k = cp.spawn('bash');

      const cmd = ['node', '-c', "\'" + f + "\'"].join(' ');

      k.stdin.write('\n' + cmd + '\n');

      process.nextTick(function () {
        k.stdin.end();
      });

      k.once('close', function (code: Number) {

        if (code < 1 && opts.verbose) {
          console.log(' => The following file was processed with no syntax errors => ', f);
        }

        cb(code && new Error('Exit code of "node -c" child process was greater than 0 for file => "' + f + '"'),
          {code: code, file: f});
      });

    }, function (err: String | Error, results: Array<CalledBackData>) {

      if (cb) {
        cb(err, results);
      }
      else {

        results = results.filter(function (r) {
          return r.code > 0;
        });

        if (err) {
          process.stderr.write('\n => Not all files were necessarily run, because:');
          process.stderr.write('\n => Node check failed for at least one file:\n' + util.inspect(results) + '\n\n');
          process.exit(1);
        }
        else {
          console.log(' => ', files.length, ' files checked with "node -c" for directory, and there appear to be zero syntax errors.');
          process.exit(0);
        }
      }
    });

  }

  const $base = ['find', `${root}`].join(' ');
  const $maxD = ['-maxdepth', `${maxDepth}`].join(' ');
  const $typeF = ['-type f'];

  const $path = paths.map(function (p: String) {
    return ' -path \"' + String(p).trim() + '\"';
  });

  const $notPath = notPaths.map(function (p: String) {
    return ' -not -path \"' + String(p).trim() + '\"';
  });

  console.log('$path', util.inspect($path));
  console.log('$notPath', util.inspect($notPath));

  const cmd = flattenDeep([$base, $maxD, $typeF, $path, $notPath]).join(' ');
  const k = cp.spawn('bash');

  k.stdin.write('\n' + cmd + '\n');

  process.nextTick(function () {
    k.stdin.end();
  });

  k.stdout.setEncoding('utf8');
  k.stderr.setEncoding('utf8');

  var stdout = '';

  k.stdout.on('data', function (data: string) {
    stdout += data;
  });

  var stderr = '';

  k.stderr.on('data', function (d: string) {
    stderr += d;
  });

  k.once('close', function (code: Number) {
    if (code > 0) {
      const err = 'Error: find command failed - \n' + cmd + '\n' + stderr;
      if (cb) {
        cb(err, []);
      }
      else {
        process.stderr.write(err);
        process.exit(1);
      }
    }
    else {

      const files = String(stdout).trim().split('\n').filter(l => l);

      if (files.length < 1) {
        if (cb) {
          cb(null, []);
        }
        else {
          process.stderr.write('No files found.');
          process.exit(1);
        }
      }
      else {

        checkAll(files);
      }
    }
  });

}
