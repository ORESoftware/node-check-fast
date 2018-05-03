'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var async = require("async");
var cp = require("child_process");
var assert = require("assert");
var os = require("os");
var path = require("path");
var util = require("util");
var chalk_1 = require("chalk");
var flattenDeep = function (a) {
    return a.reduce(function (acc, val) { return Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val); }, []);
};
var cpuCount = os.cpus().length || 2;
exports.ncf = function (opts, cb) {
    var root = opts.root || process.cwd();
    assert(path.isAbsolute(root), ' => node-check-fast => Root must be an absolute path.');
    var paths = opts.paths || ['*.js'];
    assert(Array.isArray(paths), '  => node-check-fast => "path" must be an array.');
    var notPaths = opts.notPaths || ['**/node_modules/**'];
    assert(Array.isArray(notPaths), ' => node-check-fast => "notPaths" must be an array.');
    var maxDepth = opts.maxDepth || 12;
    assert(Number.isInteger(maxDepth), '  => node-check-fast => "maxDepth" must be an integer.');
    var concurrency = opts.concurrency || cpuCount;
    assert(Number.isInteger(concurrency), ' => "concurrency" option must be an integer.');
    var checkAll = function (files, cb) {
        async.mapLimit(files, concurrency, function (f, cb) {
            var k = cp.spawn('bash');
            k.stdin.end("node -c \"" + f + "\";\n");
            k.once('exit', function (code) {
                if (code < 1 && opts.verbosity > 1) {
                    utils_1.log.info('The following file was processed with no syntax errors:', chalk_1.default.blueBright(f));
                }
                var err = null;
                if (code > 0) {
                    err = new Error('Exit code of "node -c" child process was greater than 0 for file => "' + f + '"');
                }
                cb(err, { code: code, file: f });
            });
        }, cb);
    };
    var $base = ['find', "" + root].join(' ');
    var $maxD = ['-maxdepth', "" + maxDepth].join(' ');
    var $typeF = ['-type f'];
    var $path = paths.map(function (p) {
        return ' -path \"' + String(p).trim() + '\" ';
    });
    var $notPath = notPaths.map(function (p) {
        return ' -not -path \"' + String(p).trim() + '\" ';
    });
    if (opts.verbosity > 2) {
        utils_1.log.info('verbose => "--path" option contents => ', util.inspect($path));
        utils_1.log.info('verbose => "--not-path" option contents => ', util.inspect($notPath));
    }
    var cmd = flattenDeep([$base, $maxD, $typeF, $path, $notPath]).join(' ');
    var k = cp.spawn('bash');
    k.stdin.write('\n' + cmd + '\n');
    process.nextTick(function () {
        k.stdin.end();
    });
    k.stdout.setEncoding('utf8');
    k.stderr.setEncoding('utf8');
    var stdout = '', stderr = '';
    k.stdout.on('data', function (data) {
        stdout += data;
    });
    k.stderr.on('data', function (d) {
        stderr += d;
    });
    k.once('exit', function (code) {
        if (code > 0) {
            return cb(new Error('Error: find command failed - \n' + cmd + '\n' + stderr), []);
        }
        var files = String(stdout).trim().split('\n').filter(function (l) { return l; });
        if (files.length < 1) {
            return cb(new Error('No files found.'), []);
        }
        checkAll(files, cb);
    });
};
exports.default = exports.ncf;
