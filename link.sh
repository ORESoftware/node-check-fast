#!/usr/bin/env bash

# if you aren't using NVM, then you may need sudo

cd $(dirname "$0") &&
npm link .
npm link node-check-fast