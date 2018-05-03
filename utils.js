'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var chalk_1 = require("chalk");
exports.log = {
    info: console.log.bind(console, chalk_1.default.blueBright('ncf:')),
    warn: console.log.bind(console, chalk_1.default.yellow.bold('ncf warning:')),
    error: console.error.bind(console, chalk_1.default.magenta.bold('ncf error:')),
};
