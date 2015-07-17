"use strict";
import _ from 'lodash'

// @todo Move this to DbConfig
var knex = require('knex')({
  client: 'postgres',
  connection: {
    host     : '127.0.0.1',
    user     : 'pepyatka',
    password : 'pepyatka',
    database : 'pepyatka',
    charset  : 'utf8'
  }
})

var bookshelf = require('bookshelf')(knex)
exports.Bookshelf = bookshelf

bookshelf.Model.prototype.parse = function(attrs) {
  return _.reduce(attrs, function(memo, val, key) {
    memo[_.camelCase(key)] = val;
    return memo;
  }, {});
}

bookshelf.Model.prototype.format = function(attrs) {
  return _.reduce(attrs, function(memo, val, key) {
    memo[_.snakeCase(key)] = val;
    return memo;
  }, {});
}

var User = bookshelf.Model.extend({
  tableName: 'users',
  idAttribute: 'uuid',
  hasTimestamps: ['createdAt', 'updatedAt']
  // roles: function() {
  //   return this.hasMany(Role);
  // }
})
exports.User = User

var Timeline = bookshelf.Model.extend({
  tableName: 'timelines',
  idAttribute: 'uuid',

//   posts: function() {
//     return this.belongsToMany(Post, 'timelines_posts')
//   }
})
exports.Timeline = Timeline

var Role = bookshelf.Model.extend({
  tableName: 'roles',
//   users: function() {
//     return this.belongsToMany(User)
//   }
})
exports.Role = Role

var Post = bookshelf.Model.extend({
  tableName: 'posts',
  idAttribute: 'uuid',
  hasTimestamps: ['createdAt', 'updatedAt']

  timelines: function() {
    return this.belongsToMany(Timeline, 'timelines_posts')
  },
  user: function() {
    return this.belongsToOne(User)
  }
})
exports.Post = Post

var Like = bookshelf.Model.extend({
  tableName: 'likes',
  idAttribute: 'uuid',
  hasTimestamps: ['createdAt', 'updatedAt']
//   user: function() {
//     return this.belongsTo(User)
//   },
//   post: function() {
//     return this.belongsTo(Post, 'emotions').withPivot(['meta'])
//   }
})
exports.Like = Like

var Comment = bookshelf.Model.extend({
  tableName: 'comments',
  idAttribute: 'uuid',
  hasTimestamps: ['createdAt', 'updatedAt']
//   post: function() {
//     return this.belongsTo(Post, 'posts_comments').withPivot(['meta'])
//   }
})
exports.Comment = Comment

var Attachment = bookshelf.Model.extend({
  tableName: 'attachments',
  idAttribute: 'uuid',
  hasTimestamps: ['createdAt', 'updatedAt']
//   post: function() {
//     return this.belongsTo(Post, 'posts_comments').withPivot(['meta'])
//   }
})
exports.Attachment = Attachment

// var ChangesHistoryItem = bookshelf.Model.extend({
//   tableName: 'changes_history',
//   idAttribute: 'uuid'
// })
// exports.ChangesHistoryItem = ChangesHistoryItem

// var ChangesHistory = bookshelf.Collection.extend({
//   model: ChangesHistoryItem
// })
// exports.ChangesHistory = ChangesHistory
