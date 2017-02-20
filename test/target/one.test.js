#!/usr/bin/env node
var suman = require('suman');
var Test = suman.init(module);
var ncf = require('node-check-fast');
Test.create(function (assert, it) {
    it.cb('checks successfully', function (t) {
        ncf({
            root: global.projectRoot
        }, function (err, results) {
            if (err) {
                console.error('Error => ', err, '\n');
            }
            console.log('\n');
            results.forEach(function (r) {
                console.log(' result => ', r);
            });
            console.log('\n');
            t.done(err);
        });
    });
});
