server {
	listen 443 ssl;
	server_name nikwhite.io;
	access_log /var/log/nginx/nikwhite.log;
	root /data/www/nikwhite.io/dist;
	
	ssl_certificate /etc/nginx/ssl/ssl_bundle.crt;
	ssl_certificate_key /etc/nginx/ssl/myserver.key;

	
    location = /sayhello {
    	proxy_pass http://127.0.0.1:8080/sayhello
    }

	location / {
    	
    }

}

server {
	listen 80;
	server_name www.nikwhite.net nikwhite.net www.nikwhite.io;
	return 301 https://nikwhite.io$request_uri;
}