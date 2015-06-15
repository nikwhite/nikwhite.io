grunt prod 

cp -f config/nikwhite.io /etc/nginx/sites-enabled/

service nginx restart

npm prune
npm update

forever restart sayhello.js || forever start sayhello.js