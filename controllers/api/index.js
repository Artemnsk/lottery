"use strict";

const express = require('express');
const router = express.Router();
const tokenVerification = require('../../middlewares/tokenverification');

// const userRegexp = /<@[0-9A-Z]+(\|.+)?>/i;
const commandRegexp = /^('|")([^'^"]*)(?:\1)\s(.*)$/i;

router.use('/api', tokenVerification);

router.post('/api', function(req, res) {
    var text = req.body.text;
    if (commandRegexp.test(text)) {
        let matches = commandRegexp.exec(text);
        let title = matches[2];
        let opts = matches[3];
        let optsArr = opts.split(' ');
        if (optsArr.length >= 2 && optsArr.length < 50) {
            let diceOpts = [];
            let dices = [];
            for (let i = 0; i < optsArr.length; i++) {
                let currentDice = Math.round(Math.random() * 100);
                while (dices.indexOf(currentDice) > -1) {
                    currentDice = Math.round(Math.random() * 100);
                }
                diceOpts.push({
                    dice: currentDice,
                    opt: optsArr[i]
                });
            }
            // Sort array.
            diceOpts.sort(function(a, b) {
                if (a.dice > b.dice) {
                    return -1;
                } else if (a.dice < b.dice) {
                    return +1;
                } else {
                    return 0;
                }
            });
            let result = '_' + diceOpts[0].opt + ' won with dice ' + diceOpts[0].dice + '/100!_';
            let details = "Details:\n";
            for (let i = 0; i < diceOpts.length; i++) {
                details += '*' + i + '*' + '.  Dice ' + diceOpts[i].dice + '/100 by ' + diceOpts[i].opt + ".\n";
            }
            const response = {
                response_type: "in_channel",
                text: '*' + title + '*' + '\n' + result + "\n```" + details + '```',
                link_names: true
            };
            res.json(response);
        } else {
            res.status(500).send('Not enough options or too much options.');
        }
    } else {
        res.status(500).send('Invalid format');
    }
});

module.exports = router;