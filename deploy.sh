#!/bin/bash
npm prune
npm update

cp -f config/nikwhite.io /etc/nginx/sites-enabled/

grunt prod 

service nginx reload

forever restart sayhello.js || forever start sayhello.js