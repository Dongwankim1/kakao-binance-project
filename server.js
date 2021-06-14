const WebSocket = require("ws");
const logger = require("./lib/logger");
const axios = require("axios");
const puppeteer = require("puppeteer");
const funcmessage = require("./lib/message");
const AVERAGECOUNT = 16;
const streamName = "btcbusd@kline_1m";
let html = "";
let prevPageData;

/*
setInterval(() => {
  (async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto("https://btctools.io/stats/leaderboard/");

    await page.screenshot({ path: "./ko-reactjs-homepage.png" });
    try {
      const text = await page.evaluate(() => {
        let datas = [];
        document
          .querySelector(".table")
          .children[1].childNodes.forEach((elem) => {
            let object = new Object();
            let data = new Array();

            data.push(elem.children[0].textContent);
            data.push(elem.children[1].textContent);
            data.push(elem.children[2].textContent);
            object["data"] = data;
            datas.push(object);
          });
        return datas;
      });
    } catch (err) {
      logger.warn(err);
    }
    if (!prevPageData) {
      prevPageData = text;
    }
    for (let i = 0; i < text.length; i++) {
      if (JSON.stringify(text[i]) !== JSON.stringify(prevPageData[i])) {
        prevPageData = text;
        logger.info("false");
        break;
      }
    }

    await browser.close();
  })();
}, 180000);
*/

let tempFIFMTimeTradedata = [];

function checkToData() {
  
  if (tempFIFMTimeTradedata.length >= AVERAGECOUNT) {
    let average = 0;
    let sum = 0;
    for (let i = 0; i < tempFIFMTimeTradedata.length - 1; i++) {
      sum += parseFloat(tempFIFMTimeTradedata[i].v);
    }
    average = sum / (tempFIFMTimeTradedata.length - 1);

    if (
      parseFloat(tempFIFMTimeTradedata[tempFIFMTimeTradedata.length - 1].v) >
      average * 6
    ) {
      let message = {
        title: "1분봉 거래량 증가",
        body: "바디 데이터 전송",
      };
      funcmessage.sendToMessage(message);
    }
  }
  logger.info('checkToData done')
  return true;
}

const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamName}`);

ws.onopen = (e) => {
  logger.info(`ws connected ${e}`);
};

ws.on("pong", () => {
  logger.debug("receieved pong from server");
});
ws.on("ping", () => {
  logger.debug("==========receieved ping from server");
  ws.pong();
});

ws.onclose = () => {
  logger.warn("ws closed");
};

ws.onerror = (err) => {
  logger.warn("ws error", err);
};
ws.onmessage = async (msg) => {
  try {
    const message = JSON.parse(msg.data);
    logger.info('onmessage start')
    await (function () {
      if (tempFIFMTimeTradedata.length > AVERAGECOUNT) {
        tempFIFMTimeTradedata.splice(0, 1);
      }
      if (tempFIFMTimeTradedata.length === 0) {
        let data = new Object();
        (data["opentime"] = message.k.t),
          (data["closetime"] = message.k.T),
          (data["v"] = message.k.v);

        tempFIFMTimeTradedata.push(data);
      } else if (
        tempFIFMTimeTradedata[tempFIFMTimeTradedata.length - 1]["opentime"] ===
        message.k.t
      ) {
        let data = new Object();
        (data["opentime"] = message.k.t),
          (data["closetime"] = message.k.T),
          (data["v"] = message.k.v);
        tempFIFMTimeTradedata.splice(tempFIFMTimeTradedata.length - 1, 1, data);
      } else {
        let data = new Object();
        (data["opentime"] = message.k.t),
          (data["closetime"] = message.k.T),
          (data["v"] = message.k.v);
        tempFIFMTimeTradedata.push(data);

        
      }
    })();
    await checkToData();
  } catch (e) {
    logger.warn("Parse message failed", e);
  }
};



setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping();
    logger.debug("ping server");
  }
}, 5000);
