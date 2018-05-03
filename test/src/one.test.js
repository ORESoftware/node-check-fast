#!/usr/bin/env node
const suman = require('suman');
const Test = suman.init(module);
const ncf = require('node-check-fast');
Test.create(function (assert, it) {
    it.cb('checks successfully', t => {
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
