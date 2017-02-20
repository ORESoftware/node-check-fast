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
const cpuCount = os.cpus().length || 3;


/////////////////////////////////////////////////////////////////////


export default function (opts: any) {

    const root = opts.root;
    assert(path.isAbsolute(root), ' => node-check-fast => Root must be an absolute path.');

    const notPaths = opts.notPaths || ['**/node_modules/**'];
    assert(Array.isArray(notPaths), ' => node-check-fast => "notPaths" must be an array.');

    const maxDepth = opts.maxDepth || 12;
    assert(Number.isInteger(maxDepth), '  => node-check-fast => "maxDepth" must be an integer.');

    const paths = opts.paths || ['*.js'];
    assert(Array.isArray(paths), '  => node-check-fast => "path" must be an array.');


    function checkAll(files: Array<string>) {


        async.mapLimit(files, cpuCount, function (f: String, cb: Function) {

            const k = cp.spawn('bash');

            const cmd = ['node','-c',f].join(' ');

            k.stdin.write('\n' + cmd + '\n');

            process.nextTick(function(){
               k.stdin.end();
            });

            k.once('close', function(code: Number){
                cb(code, {code: code, file: f});
            });


        }, function (err: String | Error, results: Array<string>) {

            if(err){
                process.stderr.write('\n => Not all files were necessarily run, because:');
                process.stderr.write('\n => Node check failed for at least one file:\n' + util.inspect(results));
                process.exit(1);
            }
            else{
                process.exit(0);
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


    const cmd = flattenDeep([$base, $maxD, $typeF, $path, $notPath]).join(' ');


//   const command = 'find $(dirname "$DIR") -maxdepth 8 -type f  -path "*.js" -not -path "*/node_modules/*" \
// -not -path "*/node_modules/*" -not -path "*/babel/*" -not -path "*/examples/*"';

    console.log(cmd);


    const k = cp.spawn('bash');

    k.stdin.write('\n' + cmd + '\n');

    process.nextTick(function () {
        k.stdin.end();
    });

    var d = '';

    k.stdout.setEncoding('utf8');
    k.stderr.setEncoding('utf8');

    k.stdout.on('data', function (data: String) {
        d += data;
    });

    k.stderr.pipe(process.stderr);

    k.once('close', function (code: Number) {
        if (code > 0) {
            process.stderr.write('Error: find command failed - \n' + cmd);
            process.exit(1);
        }
        else {

            if (d.length < 1) {
                process.stderr.write('no files found.');
                process.exit(1);
            }
            else {

                checkAll(String(d).split('\n').filter(l => l));
            }


        }

    });


}
