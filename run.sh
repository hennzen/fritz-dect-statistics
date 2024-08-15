#!/bin/sh
echo "---------------- $(date)"
# Exit early in case of errror
set -e 
cd /home/hennes/workspace/fritz-dect-440-reporter
echo "git pull"
/usr/bin/git pull
#echo "npm ci"
#/usr/bin/npm ci
echo "Run index.js"
node --env-file=.env index.js