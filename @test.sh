#!/usr/bin/env bash

cd $(dirname "$0") &&
NPM_ROOT=$(npm root)

if [[ -z ${NPM_ROOT} ]]; then
 echo "NPM_ROOT is not defined" && exit 1;
fi

if [[ ! -L ${NPM_ROOT}/.bin/ncf ]]; then
 echo "project is not symlinked to itself yet, let's do that now";
 npm link . &&
 npm link node-check-fast || { echo "could not symlink project";  exit 1; }
 echo "symlinked project sucessfully";
else
 echo "project has already been symlinked, which is good!";
fi

echo "transpiling from TypeScript to JS..."
./@transpile.sh
echo "Now we are starting the Suman tests"
./node_modules/.bin/suman test/target