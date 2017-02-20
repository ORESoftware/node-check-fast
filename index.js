"use strict";
var async = require('async');
var cp = require('child_process');
var assert = require('assert');
var os = require('os');
var path = require('path');
var util = require('util');
var flattenDeep = require('lodash.flattendeep');
var cpuCount = os.cpus().length;
console.log('cpuCount => ', cpuCount);
function default_1(opts) {
    var root = opts.root;
    assert(path.isAbsolute(root), ' => node-check-fast => Root must be an absolute path.');
    var notPaths = opts.notPaths || ['**/node_modules/**'];
    assert(Array.isArray(notPaths), ' => node-check-fast => "notPaths" must be an array.');
    var maxDepth = opts.maxDepth || 12;
    assert(Number.isInteger(maxDepth), '  => node-check-fast => "maxDepth" must be an integer.');
    var paths = opts.paths || ['*.js'];
    assert(Array.isArray(paths), '  => node-check-fast => "path" must be an array.');
    function checkAll(files) {
        async.mapLimit(files, cpuCount, function (f, cb) {
            var k = cp.spawn('bash');
            var cmd = ['node', '-c', f].join(' ');
            k.stdin.write('\n' + cmd + '\n');
            process.nextTick(function () {
                k.stdin.end();
            });
            k.once('close', function (code) {
                cb(code, { code: code, file: f });
            });
        }, function (err, results) {
            if (err) {
                process.stderr.write('\n => Not all files were necessarily run, because:');
                process.stderr.write('\n => Node check failed for at least one file:\n' + util.inspect(results));
                process.exit(1);
            }
            else {
                process.exit(0);
            }
        });
    }
    var $base = ['find', "" + root].join(' ');
    var $maxD = ['-maxdepth', "" + maxDepth].join(' ');
    var $typeF = ['-type f'];
    var $path = paths.map(function (p) {
        return ' -path \"' + String(p).trim() + '\"';
    });
    var $notPath = notPaths.map(function (p) {
        return ' -not -path \"' + String(p).trim() + '\"';
    });
    var cmd = flattenDeep([$base, $maxD, $typeF, $path, $notPath]).join(' ');
    console.log(cmd);
    var k = cp.spawn('bash');
    k.stdin.write('\n' + cmd + '\n');
    process.nextTick(function () {
        k.stdin.end();
    });
    var d = '';
    k.stdout.setEncoding('utf8');
    k.stderr.setEncoding('utf8');
    k.stdout.on('data', function (data) {
        d += data;
    });
    k.stderr.pipe(process.stderr);
    k.once('close', function (code) {
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
                checkAll(String(d).split('\n').filter(function (l) { return l; }));
            }
        }
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
