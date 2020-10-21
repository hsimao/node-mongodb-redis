const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
  // 使用 await next() 會等待使用此中間件 route 內的邏輯處理完(不包含非同步以及 await 事件), 才接續執行清除 redis
  await next();
  clearHash(req.user.id);
};
