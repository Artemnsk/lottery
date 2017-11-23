"use strict";

const express = require('express');
const app = express();
const publicCredentials = require('./credentials/public');

// Set view engine for app.
app.set('view engine', 'pug');
app.use('/lottery', require('./controllers'));

if (publicCredentials.useSSL) {
    const letsEncryptGateway = 'https://acme-v01.api.letsencrypt.org/directory';
    const lex = require('greenlock-express').create({
        server: letsEncryptGateway,
        agreeTos: true,
        approveDomains: function approveDomains(opts, certs, cb) {
            if (certs) {
                opts.domains = certs.altnames;
                console.log(certs.altnames);
            } else {
                opts.email = 'shelkov1991@gmail.com';
                opts.agreeTos = true;
                opts.domains = ['artemnsk.com'];
            }

            cb(null, { options: opts, certs: certs });
        },
        challenges: {
            'http-01': require('le-challenge-fs').create({
                webrootPath: '~/letsencrypt/var/acme-challenges'
            })
        },
        store: require('le-store-certbot').create({
            configDir: '~/letsencrypt/etc',
            privkeyPath: ':configDir/:hostname/privkey.pem',
            fullchainPath: ':configDir/:hostname/fullchain.pem',
            certPath: ':configDir/:hostname/cert.pem',
            chainPath: ':configDir/:hostname/chain.pem',
            workDir: '~/letsencrypt/var/lib',
            logsDir: '~/letsencrypt/var/log',
            webrootPath: '~/letsencrypt/srv/www/:hostname/.well-known/acme-challenge',
            debug: true
        })
    });

    require('http').createServer(lex.middleware(require('redirect-https')())).listen(80, function () {
        console.log("Listening for ACME http-01 challenges on", this.address());
    });

    require('https').createServer(lex.httpsOptions, lex.middleware(app)).listen(443, function () {
        console.log('Listening for ACME tls-sni-01 challenges and serve app on', this.address());
    });
} else {
    app.listen(8080, function () {
        console.log('Listening on ', this.address());
    });
}