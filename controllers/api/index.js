"use strict";

const express = require('express');
const router = express.Router();
const request = require('request');
const tokenVerification = require('../../middlewares/tokenverification');
const setSlackAccessToken = require('../../middlewares/setslackaccesstoken');

// const userRegexp = /<@[0-9A-Z]+(\|.+)?>/i;
const commandRegexp = /^(\u{27}|\u{22}|\u{AB}|\u{201C}|\u{201D}|\u{2018})([^\u{27}^\u{22}^\u{AB}^\u{BB}^\u{201C}^\u{201D}^\u{2018}^\u{2019}]*)(?:\1|\u{27}|\u{22}|\u{BB}|\u{201C}|\u{201D}|\u{2019})\s(.*)$/iu;
const nextOptWithQuotesRegexp = /^\s?(\u{27}|\u{22}|\u{AB}|\u{201C}|\u{201D}|\u{2018})([^\u{27}^\u{22}^\u{AB}^\u{BB}^\u{201C}^\u{201D}^\u{2018}^\u{2019}]*)(?:\1|\u{27}|\u{22}|\u{BB}|\u{201C}|\u{201D}|\u{2019})\s?(.*)$/iu;
const nextOptWithoutQuotesRegexp = /^\s?(\S+)\s?(.*)$/iu;

router.use('/api', tokenVerification);

router.use('/api/slash-commands', setSlackAccessToken);

router.post('/api/slash-commands/roll', function(req, res) {
    // Send 200 status.
    res.status(200).send();
    // And send actual message separately.
    let currentRoll = Math.round(Math.random() * 100);
    let json = {
        response_type: "in_channel",
        replace_original: true,
        attachments: [{
            text: "<@" + req.body.user_id + "> rolls " + currentRoll + "/100",
            color: "#3AA3E3",
            attachment_type: "default",
            callback_id: "roll"
        }]
    };
    request(req.body.response_url, {
        uri: req.body,
        method: 'POST',
        json,
        headers: {
            'Content-type': 'application/json'
        },
    });
});

router.post('/api/slash-commands/lottery', function(req, res) {
    if (commandRegexp.test(req.body.text)) {
        // Send 200 status.
        res.status(200).send();
        // And send actual message separately.
        let matches = commandRegexp.exec(req.body.text);
        let title = matches[2];
        let opts = matches[3];
        // Prepare opts in array.
        let extractOptArr;
        let optsArr = [];
        while (opts) {
            if (nextOptWithQuotesRegexp.test(opts)) {
                extractOptArr = nextOptWithQuotesRegexp.exec(opts);
                optsArr.push(extractOptArr[2]);
                opts = extractOptArr[3];
            } else if (nextOptWithoutQuotesRegexp.test(opts)) {
                extractOptArr = nextOptWithoutQuotesRegexp.exec(opts);
                optsArr.push(extractOptArr[1]);
                opts = extractOptArr[2];
            } else {
                opts = "";
            }
        }
        // Lottery.
        if (optsArr.length >= 2 && optsArr.length <= 100) {
            let diceOpts = [];
            let dices = [];
            for (let i = 0; i < optsArr.length; i++) {
                let currentDice = Math.round(Math.random() * 100);
                while (dices.indexOf(currentDice) > -1) {
                    currentDice = Math.round(Math.random() * 100);
                }
                dices.push(currentDice);
                // TODO: optsArr to link.
                diceOpts.push({
                    dice: currentDice,
                    opt: /^@/.test(optsArr[i]) ? ("<" + optsArr[i] + ">") : optsArr[i]
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
            // Finally build message.
            let result = '_' + diceOpts[0].opt + ' won with dice ' + diceOpts[0].dice + '/100!_';
            let details = "";
            for (let i = 0; i < diceOpts.length; i++) {
                details += '*' + (i + 1) + '*' + '.  Dice ' + diceOpts[i].dice + '/100 by ' + diceOpts[i].opt + "\n";
            }
            let json = {
                response_type: "in_channel",
                replace_original: true,
                link_names: true,
                text: title + ' by <@' + req.body.user_id + ">\n" + result,
                attachments: [{
                    title: "Details",
                    text: details,
                    color: "#3AA3E3",
                    attachment_type: "default",
                    callback_id: "lottery"
                }]
            };
            request(req.body.response_url, {
                uri: req.body,
                method: 'POST',
                json,
                headers: {
                    'Content-type': 'application/json'
                },
            });
        } else {
            let json = {
                response_type: "ephemeral",
                replace_original: true,
                text: 'Wrong formatted options. Do not use less than 2 options and more than 100.'
            };
            request(req.body.response_url, {
                uri: req.body,
                method: 'POST',
                json,
                headers: {
                    'Content-type': 'application/json'
                },
            });
        }
    } else {
        let json = {
            response_type: "ephemeral",
            replace_original: true,
            text: 'Invalid format.'
        };
        request(req.body.response_url, {
            uri: req.body,
            method: 'POST',
            json,
            headers: {
                'Content-type': 'application/json'
            },
        });
    }
});

module.exports = router;