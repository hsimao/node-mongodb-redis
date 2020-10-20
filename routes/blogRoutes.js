const mongoose = require('mongoose');
const requireLogin = require('../middlewares/requireLogin');
const { clearHash } = require('../services/cache');

const Blog = mongoose.model('Blog');

module.exports = app => {
  app.get('/api/blogs/:id', requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user.id,
      _id: req.params.id
    }).cache({
      key: req.params.id,
      expire: 60 * 60 * 24
    });

    res.send(blog);
  });

  app.get('/api/blogs', requireLogin, async (req, res) => {
    const blogs = await Blog.find({ _user: req.user.id }).cache({
      key: req.user.id
    });

    res.send(blogs);
  });

  app.post('/api/blogs', requireLogin, async (req, res) => {
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: req.user.id
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      res.send(400, err);
    }

    // 有更新文章就清除 redis cache, 讓取得列表時可以從 DB 取得最新資料
    clearHash(req.user.id);
  });
};
