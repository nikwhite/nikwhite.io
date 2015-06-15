grunt prod 

cp config/nikwhite.io /etc/nginx/sites-enabled/

service nginx restart

forever restart sayhello.js || forever start sayhello.js