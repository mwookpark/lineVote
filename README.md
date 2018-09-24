lineでの投票アプリ

概要

10/5(金)に開発部のバスレクを行う際に利用する
投票用LINEアプリ

■機能

1. ユーザ登録・更新機能

botユーザを友だち追加(type = fellow) > lineAccountsテーブルへ登録 > 登録完了のメッセージ

2. 投票開始

管理者画面で投票開始ボタン押下 > questionProgressテーブルに投票開始フラグをONにする/投票問題番号を更新する。
管理者画面で投票終了ボタン押下 > questionProgressテーブルに投票開始フラグをOFFにする

3. 投票

LINEから投票 > questionProgressテーブルから投票可能か確認 > 投票投票開始フラグがOFF > 投票不可のメッセージ（reply）表示
LINEから投票 > questionProgressテーブルから投票可能か確認 > 投票投票開始フラグがON > userAnswerテーブルに結果を登録 > 投票完了のメッセージ（reply）表示
LINEから投票 > questionProgressテーブルから投票可能か確認 > 投票投票開始フラグがON > userAnswerテーブルに既に結果登録済み > userAnswerテーブルの結果を上書き > 投票上書きのメッセージ（reply）表示

■要素

lambda
lineVote

API Gateway
lineVote

DynamoDB

■テーブル
lineAccounts
    userId
    displayName
    isAdmin
    registrationDate

questionProgress
    id
    questionNo
    status
    updatedDate

userAnswer
    userId-questionNo
    userId
    questionNo
    answer
    isCollect
    registrationDate
    updatedDate

question
    questionNo
    answer

■確認事項
・新規登録時のイベント処理は？


■メモ
・nodeのバージョンが変わったせいか、分からないがhttpsでのリクエストの非同期処理がおかしくなっていた。

■テストスクリプト
ACCESS_TOKEN="" serverless invoke local -f hello -p follow.json
ACCESS_TOKEN="" serverless invoke local -f hello -p vote.json


■参考
ユーザIDとアカウント名を取得
http://motojapan.hateblo.jp/entry/2017/07/08/010435

とりあえずLINE BOT APIうごかす
https://qiita.com/ki6ool/items/139b13f3493ee91ca862



