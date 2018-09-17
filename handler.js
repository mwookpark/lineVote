'use strict';

const https = require('https');
const fetch = require("node-fetch");
var accessToken = "";

async function getDisplayName(userId, callback){
    var userName = '';
    
    const options = {
            hostname: 'api.line.me',
            path: '/v2/bot/profile/' + userId,
            headers: {
                "Content-type": "application/json; charset=UTF-8",
                "Authorization": "Bearer " + accessToken,
            },
            method: 'GET'
    };

//const res = fetch('https://api.line.me/v2/bot/profile/' + userId, options);


        console.log('options:' + JSON.stringify(options));
        console.log('https:' + https);
    
        var req = https.request(options, function(res) {
            console.log('request');
            res.on('data', function(chunk) {
                console.log("RESPONSE:" + chunk.toString());
                var json_data = JSON.parse(chunk);
                console.log(json_data.displayName);
            }).on('error', function(e) {
                console.log('ERROR: ' + e.stack);
            });
        });
        
        console.log('before end');
        
        //req.write("");
        req.end(function(){
            console.log('END');
            callback();
        });
    
/**    
    return new Promise((resolve, reject) => {
        const options = {
//            hostname: 'api.line.me',
//            path: '/v2/bot/profile/' + userId,
            url: 'https://api.line.me/v2/bot/profile/' + userId,
            headers: {
//                "Content-type": "application/json; charset=UTF-8",
                "Authorization": "Bearer " + accessToken, // LINE Developersの「Channel Access Token」を使用
            },
//            method: 'GET'
        };
        
        console.log('options:' + JSON.stringify(options));

        const req = https.request(options, (res) => {
            console.log('request:');
            res.on('data', (chunk) => {
                console.log("RESPONSE:" + chunk.toString());
                
                var userName = chunk.displayName;
                resolve(userName);
            }).on('error', (error) => {
                console.log('ERROR: ' + error.stack);
            });

            res.on('end', () => {
                console.log('No more data in response.');
            });
        });

        req.on('error', (e) => {
          reject(e.message);
        });

        // send the request
        //req.write('');
        req.end();
    });
    **/
}

async function insertUser(){
    console.log("insertUser");
}

module.exports.hello = async (event, context, callback) => {
    //イベントによる分岐
    var eventType = event.body.events[0].type;
    console.log("eventType:" + eventType);
    var userId = event.body.events[0].source.userId;
    console.log("userId:" + userId);

    switch(eventType){
        //新規登録の場合
        case 'follow':
            //ユーザを特定する
            var userName = await getDisplayName(userId, insertUser);
            /**
            getDisplayName(userId).then(function(displayName){
                console.log("displayName:" + displayName);
            }).catch(function(reason){
                console.log("displayName_getError:" + reason);
            });
            **/

            //DBへ登録を行う
            console.log("DBへ登録を行う");
            //案内文を送信する
            console.log("案内文を送信する");
            break;            
    }
};
