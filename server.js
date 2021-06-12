const WebSocket = require("ws");
const logger = require("./lib/logger");

const streamName = "btcbusd@kline_15m";

const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamName}`);

ws.onopen = (e) => {
  logger.info(`ws connected ${e}` );
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
ws.onmessage = (msg) => {
    try {
      const message = JSON.parse(msg.data);
      logger.info(message.k);
      logger.info(message.e);
      logger.info(message.E);
      logger.info(`volume ${message.k.v}`);

      /*
      if (message.e) {
        if (this._handlers.has(message.e)) {
          this._handlers.get(message.e).forEach((cb) => {
            cb(message);
          });
        } else {
          logger.warn('Unprocessed method', message);
        }
      } else {
        logger.warn('Unprocessed method', message);
      }
    } catch (e) {
      logger.warn('Parse message failed', e);
    }
    */
    }catch(e){
        logger.warn('Parse message failed', e);
    }
  };
setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
      logger.debug("ping server");
    }
  }, 5000);

let lastCurrent = +new Date();

