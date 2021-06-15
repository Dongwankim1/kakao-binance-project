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

let tempOneMinDatas = [];
let tempFifMinDatas = [];
function checkToData(dataarray,type) {
  let ratio =0;
  if(type==='one'){
    ratio=ONEMINRATIO;
  }else if(type==='fift'){
    ratio=FIFTMINRATIO;
  }
  logger.info('*data count  '+type+'  '+dataarray.length);

  if (dataarray.length >= AVERAGECOUNT) {
    let average = 0;
    let sum = 0;
    for (let i = 0; i < dataarray.length - 1; i++) {
      sum += parseFloat(dataarray[i].v);
    }
    average = sum / (dataarray.length - 1);
    logger.info('*average  ',average);
    if (
      parseFloat(dataarray[dataarray.length - 1].v) >
      average * ratio
    ) {
      let message = {
        title: "1분봉 거래량 증가",
        body: "바디 데이터 전송",
      };
      funcmessage.sendToMessage(message);
    }
  }

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
    logger.info('onmessage1 start')
    try{
    await saveToMinData(msg,tempOneMinDatas)
    await checkToData(tempOneMinDatas,'one');
  } catch (e) {
    logger.warn("Parse message failed", e);
  }
};


const ws2 = new WebSocket(`wss://stream.binance.com:9443/ws/${streamName2}`);

ws2.onopen = (e) => {
  logger.info(`ws connected ${e}`);
};

ws2.on("pong", () => {
  logger.debug("receieved pong from server");
});
ws2.on("ping", () => {
  logger.debug("==========receieved ping from server");
  ws.pong();
});

ws2.onclose = () => {
  logger.warn("ws closed");
};

ws2.onerror = (err) => {
  logger.warn("ws error", err);
};
ws2.onmessage = async (msg) => {
    logger.info('onmessage2 start')
    try{
    await saveToMinData(msg,tempFifMinDatas);
    await checkToData(tempFifMinDatas,'fift');
  } catch (e) {
    logger.warn("Parse message failed", e);
  }
};



function saveToMinData(msg,dataarray){
  const message = JSON.parse(msg.data);
  logger.info('onmessage start')

    if (dataarray.length > AVERAGECOUNT) {
      dataarray.splice(0, 1);
    }
    if (dataarray.length === 0) {
      let data = new Object();
      (data["opentime"] = message.k.t),
        (data["closetime"] = message.k.T),
        (data["v"] = message.k.v);

      dataarray.push(data);
    } else if (
      dataarray[dataarray.length - 1]["opentime"] ===
      message.k.t
    ) {
      let data = new Object();
      (data["opentime"] = message.k.t),
        (data["closetime"] = message.k.T),
        (data["v"] = message.k.v);
      dataarray.splice(dataarray.length - 1, 1, data);
    } else {
      let data = new Object();
      (data["opentime"] = message.k.t),
        (data["closetime"] = message.k.T),
        (data["v"] = message.k.v);
      dataarray.push(data);
      
    }
  
}

setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping();
    logger.debug("ping1 server");
  }

  if (ws2.readyState === WebSocket.OPEN) {
    ws2.ping();
    logger.debug("ping2 server");
  }
}, 5000);
