#!/bin/sh
# Exit early in case of errror
set -e 
cd /home/hennes/workspace/fritz-dect-440-reporter
/usr/bin/git pull
/usr/bin npm ci
node --env-file=.env index.js