#!/usr/bin/env bash

cd $(dirname "$0") &&
./transpile.sh
./node_modules/.bin/suman test/target