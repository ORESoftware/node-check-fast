#!/usr/bin/env bash

# to build you must install type script compiler
cd $(dirname "$0") &&
rm -rf node_modules &&
npm install &&

tsc  # builds the project
tsc --project tsconfig-test.json # builds the tests