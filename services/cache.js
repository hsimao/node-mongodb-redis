const mongoose = require('mongoose');
const redis = require('redis');
const { promisify } = require('util');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);

// make redis get method have promise
client.hget = promisify(client.hget);

mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');
  this.expireSecond = options.expire || 0;
  return this;
};
// mongoose.Query.prototype.cache = function (expireSecond = 0) {
//   this.useCache = true;
//   this.expireSecond = expireSecond;
//   return this;
// };

// 複寫 mongoose exec 方法
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function () {
  // 執行 exec 之前需要做的邏輯, handle cache with redis
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  // 組成 redis key
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );

  // 取出 redis 值, 若有值直接 return, 不執行 mongo exec
  const cacheValue = await client.hget(this.hashKey, key);

  if (cacheValue) {
    console.log('from cache');
    // 新增一個 mongo 的資料返回格式
    const doc = JSON.parse(cacheValue);

    // 如果是 Array 將 loop new this.model
    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  // 執行 mongo exec, 將 result 同步儲存到 redis
  const result = await exec.apply(this, arguments);

  // 判斷是否有設定過期時間
  if (this.expireSecond) {
    client.hset(
      this.hashKey,
      key,
      JSON.stringify(result),
      'EX',
      this.expireSecond
    );
  } else {
    client.hset(this.hashKey, key, JSON.stringify(result));
  }

  console.log('from mongoDB');
  return result;
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
};
