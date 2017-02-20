#!/usr/bin/env node

const suman = require('suman');
const Test = suman.init(module);


const ncf = require('node-check-fast').default;

Test.create(function (assert) {

  this.it.cb('checks successfully', t => {

    ncf({
       root: global.projectRoot
      },

      function (err, results) {

      if(err){
        console.error(err);
      }

        console.log('results =>',results);
        t.done(err);

      });

  });

});
