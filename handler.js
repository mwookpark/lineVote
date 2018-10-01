'use strict';

const fetch = require("node-fetch");
const AWS = require('aws-sdk');
const DYNAMODB = new AWS.DynamoDB({region: 'ap-northeast-1'});
const ASYNC = require('async');

var accessToken = process.env.ACCESS_TOKEN;

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
 *
 **/
async function replyMessage(replyToken, customMessage){
    var message = {
        type: 'text',
        text: customMessage
    };

    var body = {
        "replyToken": replyToken,
        "messages":[
            message,
        ]
    };

    var opts = {
        method: "POST",
        headers: {
            "Content-type": "application/json; charset=UTF-8",
            "Authorization": "Bearer " + accessToken,
        },
        body: JSON.stringify(body),
    };

    console.log("replyOptions:" + JSON.stringify(opts));

    var res = await fetch('https://api.line.me/v2/bot/message/reply', opts);
    var json = await res.json();

    console.log("res:" + JSON.stringify(res));
    return JSON.stringify(res);
}


async function pushMessage(userId, customMessage){
    var message = {
        type: 'text',
        text: customMessage
    };

    var body = {
        "to": userId,
        "messages":[
            message,
        ]
    };

    var opts = {
        method: "POST",
        headers: {
            "Content-type": "application/json; charset=UTF-8",
            "Authorization": "Bearer " + accessToken,
        },
        body: JSON.stringify(body),
    };

    console.log("pushOptions:" + JSON.stringify(opts));

    var res = await fetch('https://api.line.me/v2/bot/message/push', opts);
    var json = await res.json();

    console.log("res:" + JSON.stringify(res));
    return JSON.stringify(res);
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

async function updateState(questionNo, questionStatus, answer){
    if(answer == 's'){
        questionStatus = '1';
        questionNo = parseInt(questionNo) + 1;
        questionNo = questionNo + '';
    }else if(answer == 'reset'){
        questionStatus = '1';
        questionNo = '1';
    }else{
        questionStatus = '0';
    }

    var params = {
        TableName: 'questionProgress',
        Item: {
            'id': {"N": "1"},
            'questionNo': {N: questionNo},
            'status': {N: questionStatus},
            'updatedDate': {S: getNowDateTime()}
        }
    };

    var put_result = await DYNAMODB.putItem(params).promise();

    console.log(put_result);

    return put_result;
}

async function getImageURL(questionNo){
    var params = {
        TableName: 'question',
        Key: {
            "questionNo": {"N": questionNo}
        }
    };

    var queryItems = await DYNAMODB.getItem(params).promise();

    return queryItems.Item.image.S;
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

async function getAllUsers(){
    var params = {
        TableName: 'lineAccounts',
        Select: "ALL_ATTRIBUTES"
    };

    var scan_result = await DYNAMODB.scan(params).promise();

    console.log(scan_result);

    return scan_result.Items;
}

async function sendAllUsersMessage(customMessage, questionNo){
    var dbUsers = await getAllUsers();

    var users = [];

    dbUsers.forEach(function(item){
        users.push(item.userId.S);
    });

    var message = {
        type: 'text',
        text: customMessage
    };

    var body = {
        "to": users,
        "messages":[
            message,
        ]
    };

    console.log('body:' + JSON.stringify(body));

    var opts = {
        method: "POST",
        headers: {
            "Content-type": "application/json; charset=UTF-8",
            "Authorization": "Bearer " + accessToken,
        },
        body: JSON.stringify(body),
    };

    console.log("multicastOptions:" + JSON.stringify(opts));

    var res = await fetch('https://api.line.me/v2/bot/message/multicast', opts);
    var json = await res.json();

    //画像も送る
    if(questionNo > 0){
        var imageURL = await getImageURL(questionNo);

        message = {
            type: 'image',
            originalContentUrl: imageURL,
            previewImageUrl: imageURL,
        };

        body = {
            "to": users,
            "messages":[
                message,
            ]
        };

        opts = {
            method: "POST",
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "Authorization": "Bearer " + accessToken,
            },
            body: JSON.stringify(body),
        };

        console.log("multicastOptions:" + JSON.stringify(opts));

        res = await fetch('https://api.line.me/v2/bot/message/multicast', opts);
        json = await res.json();
    }

    return true;
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
    //context.callbackWaitsForEmptyEventLoop = false;
    console.log(event);

    //DynamoDB event
    if('Records' in event && event.Records.length != 0) {
        var source = event.Records[0].eventSourceARN;

        if(source.indexOf('/questionProgress/') != -1) {
            var recordImage = event.Records[0].dynamodb.NewImage;

            var message = '問題No.' + recordImage.questionNo.N + 'を〆ます。';
            var questionNo = 0;

            if(recordImage.status.N == 1){
                message = '問題No.' + recordImage.questionNo.N + 'を開始します。';
                questionNo = recordImage.questionNo.N;
            }

            //すべてのユーザへ送信
            var send_result = await sendAllUsersMessage(message, questionNo);
            console.log('send_result:' + send_result);
        }

        return;
    }

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
                //replyMessage(replyToken, welcomeMessage);
                //var send_result = await replyMessage(replyToken, welcomeMessage);
                var send_result = await pushMessage(userId, welcomeMessage);
                console.log('send_result:' + send_result);
            }
            break;
        case 'message':
            //DBから投票可能な状態かを確認
            var questionStatus = await getStatus();
            var questionNo = questionStatus.questionNo.N;
            var answer = eventBody.message.text;

            //user名を取得
            var userName = await getDisplayName(userId);
console.log('userName:' + userName);
console.log('answer:' + answer);

            if((userName == 'min' || userName == 'あすみ') && (answer == 'e' || answer =='s' || answer == 'reset')){
                var send_result = await updateState(questionNo, questionStatus, answer);
                return;
            }

            if(questionStatus.status.N == 0){
                var notVoteMessage = userName + 'よ、問題No.' + questionNo + 'は開始前である。';
                var send_result = await replyMessage(replyToken, notVoteMessage);
                console.log('send_result:' + send_result);
            }else{
                //1~3ではなければメッセージを送る
                if(answer == '1' || answer == '2' || answer == '3' ){
                    var update_result = await updateUserAnswer(userId, questionNo, answer);

                    if(update_result){
                        var votedMessage = userName + 'は問題No.' + questionNo + 'に' + answer + 'と返答した。';
                        var send_result = await replyMessage(replyToken, votedMessage);
                        console.log('send_result:' + send_result);
                    }

                    return;
                }

                var message = userName + '様が'+answer+'しました。';
                console.log(message);

                //すべてのユーザへ送信
                var send_result = await sendAllUsersMessage(message, 0);
                console.log('send_result:' + send_result);
            }

            break;
    }
};
