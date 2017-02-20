"use strict";
var async = require('async');
var cp = require('child_process');
var assert = require('assert');
var os = require('os');
var path = require('path');
var util = require('util');
var flattenDeep = require('lodash.flattendeep');
var cpuCount = os.cpus().length || 2;
module.exports = function (opts, cb) {
    var root = opts.root || '';
    assert(path.isAbsolute(root), ' => node-check-fast => Root must be an absolute path.');
    var notPaths = opts.notPaths || ['**/node_modules/**'];
    assert(Array.isArray(notPaths), ' => node-check-fast => "notPaths" must be an array.');
    var maxDepth = opts.maxDepth || 12;
    assert(Number.isInteger(maxDepth), '  => node-check-fast => "maxDepth" must be an integer.');
    var paths = opts.paths || ['*.js'];
    assert(Array.isArray(paths), '  => node-check-fast => "path" must be an array.');
    if ('concurrency' in opts) {
        assert(Number.isInteger(opts.concurrency), ' => "concurrency" option must be an integer.');
    }
    var $concurrency = opts.concurrency || cpuCount;
    function checkAll(files) {
        async.mapLimit(files, $concurrency, function (f, cb) {
            var k = cp.spawn('bash');
            var cmd = ['node', '-c', f].join(' ');
            k.stdin.write('\n' + cmd + '\n');
            process.nextTick(function () {
                k.stdin.end();
            });
            k.once('close', function (code) {
                cb(code && new Error('Exit code of "node -c" child process was greater than 0 for file => "' + f + '"'), { code: code, file: f });
            });
        }, function (err, results) {
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
                    process.exit(0);
                }
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
    var k = cp.spawn('bash');
    k.stdin.write('\n' + cmd + '\n');
    process.nextTick(function () {
        k.stdin.end();
    });
    k.stdout.setEncoding('utf8');
    k.stderr.setEncoding('utf8');
    var stdout = '';
    k.stdout.on('data', function (data) {
        stdout += data;
    });
    var stderr = '';
    k.stderr.on('data', function (d) {
        stderr += d;
    });
    k.once('close', function (code) {
        if (code > 0) {
            var err = 'Error: find command failed - \n' + cmd + '\n' + stderr;
            if (cb) {
                cb(err, []);
            }
            else {
                process.stderr.write(err);
                process.exit(1);
            }
        }
        else {
            var files = String(stdout).trim().split('\n').filter(function (l) { return l; });
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
};
