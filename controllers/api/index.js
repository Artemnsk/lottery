"use strict";

const express = require('express');
const router = express.Router();
const tokenVerification = require('../../middlewares/tokenverification');

router.use('/api', tokenVerification);

router.post('/api', function(req, res) {
    const response = {
        response_type: "in_channel",
        text: 'works!'
    };
    res.json(response);
});

module.exports = router;