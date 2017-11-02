"use strict";

module.exports = verifyToken;
const publicCredentials = require('../credentials/public');

/**
 * Compare verification token we got in request with value we have generated for current Slack app.
 */
function verifyToken(req, res, next) {
    if (req.body.token === publicCredentials.verification_token) {
        next();
    } else {
        res.status(400);
        res.send('Permissions denied. You are unable to use app not via Slack client.');
    }
}