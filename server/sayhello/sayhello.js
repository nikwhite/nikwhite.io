var express = require('express')
var bodyParser = require('body-parser')
var nodemailer = require('nodemailer')
var morgan = require('morgan')
var fs = require('fs')
var config = require('./config/config.json')

var logStream = fs.createWriteStream(config.SAYHELLO_LOG)
var log = new (require('log'))('debug', logStream)

var app = express()

var transporter = nodemailer.createTransport({
    service: 'gmail',
    secure: true,
    auth: {
        user: config.MAILER_EMAIL,
        pass: process.env.MAILER_PASS
    }
})



app.use( morgan('combined', { stream: logStream }) )

app.use( bodyParser.urlencoded({ extended: true }) )

app.post( config.SAYHELLO_ROUTE, function (req, res, next) {

	if (!req.body.email || !req.body.message) {
		log.error('Incorrect contents')
		
		res.status(500).end()

	} else {
		
		transporter.sendMail({
			from: config.MAILER_EMAIL,
			replyTo: req.body.email,
			to: config.MY_EMAIL,
			subject: 'Web contact lead from ' + req.body.email,
			text: req.body.message
		
		}, function mailSent(err, info) {
			if (err || info.rejected.length > 0) {
				log.error(err.response)
				res.status(500).end()
			} else {
				res.status(200).end()
			}
		})		
	}
	

})

app.listen(8080)