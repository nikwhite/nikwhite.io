# nikwhite.io
## Env setup

### nginx config

```bash
cp config/nikwhite.io /etc/nginx/sites-enabled
```

### Node app

```bash
npm install -g forever
```

#### In .bashrc:

```bash
export MAILER_PASS="[the password for sending emails]"
```