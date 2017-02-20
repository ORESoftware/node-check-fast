#!/usr/bin/env bash

# to build you must install type script compiler
cd $(dirname "$0") &&
rm -rf node_modules &&
npm install &&
./transpile.sh
