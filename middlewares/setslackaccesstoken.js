"use strict";

const fs = require('fs');

module.exports = setSlackAccessToken;

/**
 * Compare verification token we got in request with value we have generated for current Slack app.
 */
function setSlackAccessToken(req, res, next) {
    if (!req.body.team_id) {
        // TODO: better text.
        res.status(500).send('Error.');
    } else {
        let filePath = __dirname + '/../tokens/' + req.body.team_id + '.txt';
        fs.readFile(filePath, (err, token) => {
            if (err) {
                // TODO: error.
                res.status(500).send('Error.');
            } else {
                req.slackAccessToken = token.toString().replace(/\s/g, "");
                next();
            }
        });
    }
}