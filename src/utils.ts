'use strict';

import chalk from 'chalk';

export const log = {
  info: console.log.bind(console, chalk.blueBright('ncf:')),
  warn: console.log.bind(console, chalk.yellow.bold('ncf warning:')),
  error: console.error.bind(console, chalk.magenta.bold('ncf error:')),
};