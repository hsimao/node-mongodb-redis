const mongoose = require('mongoose');
const redis = require('redis');
const { promisify } = require('util');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);

// make redis get method have promise
client.get = promisify(client.get);

// 複寫 mongoose exec 方法
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function () {
  // 執行 exec 之前需要做的邏輯, handle cache with redis
  console.log('Im about to run a query');

  // 組成 redis key
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );

  // 取出 redis 值, 若有值直接 return, 不執行 mongo exec
  const cacheValue = await client.get(key);

  if (cacheValue) {
    // 新增一個 mongo 的資料返回格式
    const doc = JSON.parse(cacheValue);

    // 如果是 Array 將 loop new this.model
    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  // 執行 mongo exec, 將 result 同步儲存到 redis
  const result = await exec.apply(this, arguments);
  client.set(key, JSON.stringify(result));
  return result;
};
