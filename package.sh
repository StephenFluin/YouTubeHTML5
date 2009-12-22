#!/bin/sh
echo "Creating zip for upload to the Google Extension Gallery"
zip -r YouTubeHTML5.zip . -x "*.svn*" -x ".*" -x "package.sh"
