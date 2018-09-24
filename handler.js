'use strict';

const fetch = require("node-fetch");
const line = require('@line/bot-sdk');
const AWS = require('aws-sdk');
const DYNAMODB = new AWS.DynamoDB({region: 'ap-northeast-1'});

var accessToken = process.env.ACCESS_TOKEN;
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
    var message = {
        type: 'text',
        text: customMessage
    };

    console.log("replyMessage:" + JSON.stringify(message));

    //var send_result = await client.replyMessage(replyToken, JSON.stringify(message));

    //console.log('send_result:' + send_result);

    //return send_result;

    client.replyMessage(replyToken, JSON.stringify(message))
        .then((response) => {
            console.log("response:" + response);
        })
        .catch((err, error_description) => {
            console.log("reply err:" + err);
            console.log("error_description:" + error_description);
        });
}

async function insertNewUser(userId, userName){
    var params = {
        TableName: 'lineAccounts',
        Item: {
            'userId': {S :userId},
            'displayName': {S :userName},
            'isAdmin': {BOOL: false},
            'registrationDate': {S: getNowDateTime()}
        }
    };


    var put_result = await DYNAMODB.putItem(params).promise();

    console.log(put_result);

    return true;
    //DYNAMODB.putItem(params, function (err, res) {
    //    if(err){
    //        console.log(err, err.stack);
    //    }else{
    //        console.log(userName + "is inserted");
    //        return true;
    //    }
    //});
}

async function getStatus(){
    var params = {
        TableName: 'questionProgress',
        Key: {
            "id": {"N": "1"}
        }
    };

    var queryItems = await DYNAMODB.getItem(params).promise();

    return queryItems.Item;
}

async function updateUserAnswer(userId, questionNo, answer){
    var params = {
        TableName: 'userAnswer',
        Item: {
            'userId-questionNo': {S :userId + '-' + questionNo},
            'userId': {S :userId},
            'questionNo': {N: questionNo},
            'answer': {S :answer},
            'registrationDate': {S: getNowDateTime()},
            'updatedDate': {S: getNowDateTime()}
        }
    };

    var put_result = await DYNAMODB.putItem(params).promise();

    console.log(put_result);

    return put_result;
}


function getNowDate(){
    var date = new Date();
    return date.getFullYear() + '/' +  getZeroPadding(date.getMonth() + 1) + '/' + getZeroPadding(date.getDate());
}

function getNowDateTime(){
    var date = new Date();
    return getNowDate() + ' ' + getZeroPadding(date.getHours()) + getZeroPadding(date.getMinutes()) + getZeroPadding(date.getSeconds());
}

function getZeroPadding(pNumber){
    return ('00' + (pNumber)).slice(-2);
}

module.exports.hello = async (event, context, callback) => {
    console.log(event);
    //for deply
    //var eventBody = JSON.parse(event.events[0]);
    //for local
    var eventBody = event.events[0];

    var eventType = eventBody.type;
    var replyToken = eventBody.replyToken;
    console.log("eventType:" + eventType);
    var userId = eventBody.source.userId;
    console.log("userId:" + userId);

    switch(eventType){
        //新規登録の場合
        case 'follow':
            //ユーザを特定する
            var userName = await getDisplayName(userId);
            console.log("displayName:" + userName);

            //DBへ登録を行う
            var insert_result = await insertNewUser(userId, userName);

            //案内文を送信する
            if(insert_result){
                var welcomeMessage = userName + '様、ようこそ';
                replyMessage(replyToken, welcomeMessage);
            }
            break;
        case 'message':
            //DBから投票可能な状態かを確認
            var questionStatus = await getStatus();
            var questionNo = questionStatus.questionNo.N;

            if(questionStatus.status.N == 0){
                var notVoteMessage = '問題No.' + questionNo + 'は開始前です。';
                replyMessage(replyToken, notVoteMessage);
            }else{
                var answer = eventBody.message.text;

                var update_result = await updateUserAnswer(userId, questionNo, answer);

                if(update_result){
                    var votedMessage = '問題No.' + questionNo + 'に' + answer + 'を返答しました。';
                    replyMessage(replyToken, votedMessage);
                }
            }

            break;
    }
};
