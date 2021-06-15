const WebSocket = require("ws");
const logger = require("./lib/logger");
const axios = require("axios");
const puppeteer = require("puppeteer");
const funcmessage = require("./lib/message");

const streamName = "btcbusd@kline_1m";
const streamName2 = "btcbusd@kline_15m";

const AVERAGECOUNT = 16;
const ONEMINRATIO = 9;
const FIFTMINRATIO = 5;
let html = "";
let prevPageData;

for(let i=0;i<3;i++){
    funcmessage.sendToMessage( {
        title:'시범 데이터 발송11',
        body:'바디 데이터 전송'
    },i);
}

