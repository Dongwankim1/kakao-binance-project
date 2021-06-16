const admin = require('firebase-admin');
const logger = require("../lib/logger");
const serviceAccount = require('../config/bianance-kakao-firebase-adminsdk-eb7hw-5ee17949cc.json');
const shell = require('shelljs')



admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})
var id = "";
const fcm_target = require('../config/fmc.token');
function sendToMessage(notification, confirmId) {
    this.id = "";
    /*
    {
        title:'시범 데이터 발송11',
        body:'바디 데이터 전송'
    }
    */


    
    let fcm_message = {
        notification: notification,
        token: fcm_target.token[0],
    }
    let today = new Date();
    let year = today.getFullYear(); // 년도
    let month = today.getMonth() + 1;  // 월
    let date = today.getDate();  // 날짜
    let todaytime = String(year)+'-'+String(month)+'-'+String(date);

    if (this.id !== confirmId) {
        admin.messaging().send(fcm_message).then((rep) => {
            if (process.platform !== 'win32') {
                shell.exec(`echo '보내기 메세지 성공' ${notification.body} *** '${today}' *** ${rep} >> ./logs/ll${todaytime}messagelog.txt`)
            }
 
            logger.info(`보내기 메세지 성공1 ${rep}`);
            this.id=confirmId;
        }).catch((err) => {
            logger.info(`보내기 실패12 ${err}`);
        })
    }

}


module.exports = {
    sendToMessage: sendToMessage
}