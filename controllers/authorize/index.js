"use strict";

const express = require('express');
const router = express.Router();
const url = require('url');
const https = require('https');
const queryString = require('querystring');
const publicCredentials = require('../../credentials/public');
const privateCredentials = require('../../credentials/private');
// This URL is used as redirect_uri in OAuth process.
const authRedirectURL = url.format({
    protocol: publicCredentials.protocol,
    hostname: publicCredentials.host,
    pathname: '/lottery/authorize/complete'
});

router.get('/authorize/request', authorizeRequest);
router.get('/authorize/complete', authorizeComplete);

module.exports = router;

/**
 * Simply redirects on Slack's authorize app page with needed data provided (like client_id).
 */
function authorizeRequest(req, res, next) {
    const redirectURL = url.format({
        protocol: "https",
        hostname: "slack.com",
        pathname: "oauth/authorize",
        query: {
            "client_id": publicCredentials.client_id,
            "scope": 'commands',
            "redirect_uri": authRedirectURL
        }
    });
    res.redirect(redirectURL);
}

/**
 * Exchanges "code" string got from Slack on access_token:
 * 1. That will actually install app in workspace as requested by user.
 * 2. access_token then will be used to make Slack API calls which being allowed by this access_token.
 */
function authorizeComplete(req, res, next) {
    const code = req.query.code;
    if (code) {
        // Prepare data to be send via HTTP request.
        const data = queryString.stringify({
            'code': code,
            'redirect_uri': authRedirectURL
        });
        // Perform Basic auth using client_id and client_secret.
        const auth = 'Basic ' + new Buffer(publicCredentials.client_id + ':' + privateCredentials.client_secret).toString('base64');
        const options = {
            host: 'slack.com',
            port: 443,
            path: '/api/oauth.access',
            method: 'POST',
            headers: {
                'Content-type': 'application/x-www-form-urlencoded',
                'Authorization': auth,
                'Content-Length': Buffer.byteLength(data)
            }
        };
        // Send request to Slack.
        var request = https.request(options, function(response) {
            let responseMessage = "";
            response.setEncoding('utf8');
            response.on('data', function(chunk) {
                responseMessage += chunk;
            });
            response.on('end', function() {
                // TODO: save token.
                res.render(__dirname + '/../../views/authorizationcompleted');
            });
        });
        request.write(data);
        request.end();
    }
}