# lineでの投票アプリ

## 概要

10/5(金)開発部のバスレクを行う際に利用する
投票用LINEアプリ

## 機能

### 1. ユーザ登録・更新機能

botユーザを友だち追加(type = fellow) > lineAccountsテーブルへ登録 > 登録完了のメッセージ

### 2. 投票開始

管理者画面で投票開始メッセージ > questionProgressテーブルに投票開始フラグをONにする/投票問題番号を更新する。
管理者画面で投票終了メッセージ > questionProgressテーブルに投票開始フラグをOFFにする

### 3. 投票

LINEから投票 > questionProgressテーブルから投票可能か確認 > 投票投票開始フラグがOFF > 投票不可のメッセージ（reply）表示
LINEから投票 > questionProgressテーブルから投票可能か確認 > 投票投票開始フラグがON > userAnswerテーブルに結果を登録 > 投票完了のメッセージ（reply）表示

### 4. おまけ

雑談の全体配信


## 要素

### 配信機能

lambda > lineVote
API Gateway > lineVote(POST)
DynamoDB : ユーザ / 問題 / 回答情報
S3 : 問題の画像、集計用でexportいたcsvの格納

### 結果統計

athena用SQL

SELECT t3.displayname, count(t2.answer) as collect_count
FROM question t1 JOIN user_answer t2
ON t1.questionno = t2.questionno
AND t1.answer = t2.answer
JOIN line_account t3
ON t2.userid = t3.userid
GROUP BY t3.displayname
ORDER BY count(t2.answer) DESC;


## テーブル
lineAccounts
```
    userId
    displayName
    isAdmin
    registrationDate
```

questionProgress
```
    id
    questionNo
    status
    updatedDate
```

userAnswer
```
    userId-questionNo
    userId
    questionNo
    answer
    isCollect
    registrationDate
    updatedDate
```

question
```
    questionNo
    answer
```


## メモ
・nodeのバージョンが変わったせいか、分からないがhttpsでのリクエストの非同期処理がおかしくなっていた。
・lineへのリクエスト時に非同期実行になっている為、失敗。
試してダメだったのは
node-fetch, @line/bot-sdk, https
node-fetchにawaitを掛けたらできた
・集計はDynamoDB > DataPipeline > athenaでやるつもりだったが
DataPipelineの操作方法がよくわからなくて、DynamoDBからCSVを落として > S3保存 > athena読み取りを行った。ただし、やり方の問題なのかCSVを落とす方法によっては既存のカラムマッピングとマッチしなくなり、SQL文を作り直す必要があった。
・DynamoDBからCSVのexportは1回に100件までしかできないことが分かった。色々やり方はあるらしいが
DynamoDBtoCSVといった物を利用してCSV抽出ができた。
・今後はスタンプも送れるようにしたい。

## 参考コマンド

### テストスクリプト
ACCESS_TOKEN="" serverless invoke local -f hello -p follow.json
ACCESS_TOKEN="" serverless invoke local -f hello -p vote.json
ACCESS_TOKEN="" serverless invoke local -f hello -p dbstream.json（テストデータ作成中）

### デプロイ
serverless deploy
serverless deploy function -f hello

### 不必要なパッケージ削除
npm prune


## 参考
ユーザIDとアカウント名を取得
http://motojapan.hateblo.jp/entry/2017/07/08/010435

とりあえずLINE BOT APIうごかす
https://qiita.com/ki6ool/items/139b13f3493ee91ca862

then-request
https://www.npmjs.com/package/then-request

ServerlessでDynamoDBの更新イベントをトリガーとしてLambdaを実行する
https://qiita.com/ashiken/items/a7bab1f044f8c83e3b9b

Node.jsでfetchを使えるようにする
https://morizyun.github.io/javascript/node-js-npm-library-node-fetch.html

DynamoDBtoCSV
https://github.com/edasque/DynamoDBtoCSV
