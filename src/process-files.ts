'use strict';

//core
import cp = require('child_process');

//npm
import async = require('async');
import chalk from "chalk";
import log from "./utils";
import {AsyncQueue} from "async";

/////////////////////////////////////////////////////////////////////////////////

export const makeProcessFile = function (q: AsyncQueue<any>, results: Array<any>, opts: any) {

  return function processFile(f: string) {

    return function (cb: any) {

      const k = cp.spawn('bash');
      k.stdin.end(`node -c "${f}";\n`);

      k.once('exit', function (code) {

        if (code < 1 && opts.verbosity > 1) {
          log.info('The following file was processed with no syntax errors:', chalk.blueBright(f));
        }

        let err = null;

        if (code > 0) {
          err = new Error('Exit code of "node -c" child process was greater than 0 for file => "' + f + '"');
        }

        results.push({code: code, file: f});

        cb(err);

      });

    }
  };


};