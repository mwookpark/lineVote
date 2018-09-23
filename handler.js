'use strict';

const fetch = require("node-fetch");
const line = require('@line/bot-sdk');

var accessToken = "";
const client = new line.Client({
    channelAccessToken: accessToken
});

async function getDisplayName(userId){
    var options = {
            hostname: 'api.line.me',
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "Authorization": "Bearer " + accessToken,
            },
            method: 'GET'
    };

    var res = await fetch('https://api.line.me/v2/bot/profile/' + userId, options);
    var json = await res.json();

    return json.displayName;
}

/**
 * 時間が立ってしまうとreplyはできないので
 * 400が帰ってきたら無視する
 *
 * */
async function replyMessage(replyToken, customMessage){
    const message = {
        type: 'text',
        text: customMessage
    };

    console.log("replyMessage:" + JSON.stringify(message));

    client.replyMessage(replyToken, message)
        .then((response) => {
            console.log("response:" + response);
        })
        .catch((err) => {
            console.log("err:" + err);
        });
}

async function insertUser(){
    console.log("insertUser");
}

module.exports.hello = async (event, context, callback) => {
    //イベントによる分岐
    var eventType = event.body.events[0].type;
    var replyToken = event.body.events[0].replyToken;
    console.log("eventType:" + eventType);
    var userId = event.body.events[0].source.userId;
    console.log("userId:" + userId);

    switch(eventType){
        //新規登録の場合
        case 'follow':
            //ユーザを特定する
            var userName = await getDisplayName(userId);
            console.log("displayName:" + userName);

            //DBへ登録を行う
            console.log("DBへ登録を行う");
            //案内文を送信する
            console.log("案内文を送信する");

            var welcomeMessage = userName + '様、ようこそ';
            replyMessage(replyToken, welcomeMessage);
            break;
    }
};
