#!/usr/bin/env bash

cd $(dirname "$0") &&
git add . &&
git add -A &&
git commit --allow-empty -am "set:s" &&
git push &&
echo "pushed successfully"