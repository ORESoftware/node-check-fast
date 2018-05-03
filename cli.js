#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.once('exit', function (code) {
    console.log(' => node-check-fast exiting with code => ', code);
});
var utils_1 = require("./utils");
var path = require("path");
var dashdash = require('dashdash');
var ncf_1 = require("./ncf");
var chalk_1 = require("chalk");
var util = require("util");
var options = [
    {
        names: ['help', 'h'],
        type: 'bool',
        help: 'Print help menu and exit.'
    },
    {
        names: ['paths', 'p'],
        type: 'arrayOfString',
        help: 'List of paths to match.'
    },
    {
        names: ['not-paths', 'np'],
        type: 'arrayOfString',
        help: 'List of paths that do not match.'
    },
    {
        names: ['verbosity', 'v'],
        type: 'integer',
        help: 'Choose a verbosity level, {1,2,3} - higher the number the more verbose, default is 2.',
        default: 2
    },
    {
        names: ['max-depth'],
        type: 'integer',
        help: 'Maximum depth to recurse through directories.',
        default: 12
    },
    {
        names: ['concurrency', 'c'],
        type: 'integer',
        default: 3
    },
    {
        names: ['root'],
        type: 'string',
        default: '.'
    }
];
var parser = dashdash.createParser({ options: options });
var opts;
try {
    opts = parser.parse(process.argv);
}
catch (e) {
    console.error('Opts parsing error: %s', e.message);
    process.exit(1);
}
if (opts.help) {
    var help = parser.help({ includeEnv: true }).trimRight();
    console.log('usage: node-check-fast [OPTIONS]\n'
        + 'options:\n'
        + help);
    process.exit(1);
}
var cwd = process.cwd();
var root = opts.root;
if (!root) {
    utils_1.log.info('warning: no "--root" option was passed at the command line');
    utils_1.log.info('therefore Node-Check-Fast will use the current working directory as root.');
    root = cwd;
}
else {
    if (!path.isAbsolute(root)) {
        root = path.resolve(cwd + '/' + root);
    }
}
ncf_1.ncf({
    root: root,
    notPaths: opts.not_paths,
    paths: opts.paths,
    maxDepth: opts.max_depth,
    verbosity: opts.verbosity,
    concurrency: opts.concurrency
}, function (err, results) {
    if (err) {
        utils_1.log.error('Not all files were necessarily run, because we may have exited early..because:');
        utils_1.log.error(chalk_1.default.red.bold(' => Node check failed for at least one file:') + '\n' + util.inspect(results));
        return process.exit(1);
    }
    var successful = results.filter(function (r) {
        return r && r.code === 0;
    });
    if (successful.length = results.length) {
        utils_1.log.info('All your process are belong to success.');
        return process.exit(0);
    }
    utils_1.log.error('At least one process exitted with a non-zero code.');
    process.exit(1);
});
