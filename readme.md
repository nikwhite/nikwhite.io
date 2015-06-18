# nikwhite.io
## Server setup

Server needs:
* Node.js
* nginx
* Key-based authenticaton

In .bashrc, add:

```bash
export MAILER_PASS="[the password for sending emails]"
```

Then do:

```bash
$ npm install -g forever
$ mkdir -p /data/www
$ git clone git@github.com:nikwhite/nikwhite.io.git /data/www/nikwhite.io
$ /data/www/nikwhite.io/deploy.sh
```

## Dev machine setup

In .bash_profile:

```bash
alias nikwhite-deploy="ssh [user]@[ip] 'cd /data/www/nikwhite.io && git pull && ./deploy.sh'""
```