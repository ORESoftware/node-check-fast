'use strict';

import chalk from "chalk";
import log from "./utils";


export const handleResults = function (err: any, results: Array<any>) {

  const failures = results.filter(function (r) {
    return !(r && r.code === 0);
  });

  failures.forEach(function (f) {
    log.warn('code:', f.code, 'file:', f.file)
  });

  if (err) {
    log.error('Not all files were necessarily run, because we may have exited early.');
    log.error('Node check failed for at least one file.');
    return process.exit(1);
  }

  if (results.length < 1) {
    log.warn('No files matched, and no files were checked.');
    return process.exit(1);
  }

  if (failures.length < 1) {
    log.success(chalk.green.bold('All your process are belong to success.'));
    log.success(chalk.green.bold(`${chalk.blue.bold(String(results.length))} files were checked with 'node -c' in your project.`));
    return process.exit(0);
  }

  failures.forEach(function (f) {
    log.warn('code:', f.code, 'file:', chalk.red(f.file))
  });

  log.error(chalk.red('At least one process exitted with a non-zero code.'));
  process.exit(1);

};

