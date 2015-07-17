//
// Grab data from redis and populate it to PostgreSQL
//
"use strict";
import express from 'express'
import environment from './config/environment'
import _ from 'lodash'
import redis from './config/database'
import models from './app/models'
import orm from './orm'

process.env.NODE_ENV = "development"

var run = async function() {
  console.log(`Start`)
  var app = express()
  console.log(`Start2`)
  var app = await environment.init(app)
  console.log(`Start3`)
  var database = redis.connect()
  console.log(`Start4`)

  var usernames = await database.keysAsync('username:*')
  console.log(`Start5`)
  var userIds = await* usernames.map((username) => database.getAsync(username))
  console.log(`Start6`)
  var users = await* userIds.map((userId) => models.FeedFactory.findById(userId))
  console.log(`Start7`)
  var timelines = await* users.map((user) => user.getPostsTimeline())
  console.log(`Start8`)

  await* users.map(async function(user) {
    console.log(`Start9`)
    var u = orm.User.forge({uuid: user.id})
    u = await u.fetch()
    if (!u) {
      u = orm.User.forge({
        username: user.username,
        screenName: user.screenName,
        hashedPassword: user.hashedPassword,
        email: user.email,
        isPrivate: user.isPrivate,
        type: user.type,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: null,
        tokens: {},
        bans: []
      })
      console.log(`Save a new user ${user.username}`)
      u.save({uuid: user.id})
    } else {
      console.log(`Update existing user ${user.username}`)
      u.save({
        username: user.username,
        screenName: user.screenName,
        hashedPassword: user.hashedPassword,
        email: user.email,
        isPrivate: user.isPrivate,
        type: user.type,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: null,
        tokens: {},
        bans: []
      }, {patch: true})
    }
  })
  console.log(`Users saved`)

  await* timelines.map(async function(timeline) {
    console.log(`Start12`)
    var t = orm.Timeline.forge({
      type: 'Posts'
    })
    console.log(`Start13`)
    await t.save({uuid: timeline.id})
    console.log(`Timeline ${t.id} saved`)

    let posts = await timeline.getPosts(0, 10)
    console.log(`Start14`)
    await* posts.map(async function(post) {
      console.log(JSON.stringify(post))
      var p = orm.Post.forge({
        body: post.body,
        user: post.userId
      })
      console.log(`Start15`)
      await p.save({uuid: post.id})
      console.log(`Post ${p.id} saved`)
  //     let postedTo = await post.getPostedToIds()
  //     console.log('Checking post ' + post.id + '.')
  //     if (postedTo.length === 0) {
  //       let user = await models.User.findById(post.userId)
  //       let key = await user.getPostsTimelineId()
  //       let to = mkKey(["post", post.id, "to"])
  //       console.log('Need to set ' + to + ' to ' + key + '.')
  //       await database.sadd(to, key)
  //       console.log('Fixed.')
  //     } else {
  //       console.log('OK.')
  //     }
    })
  })

  console.log('Done.')
  process.exit()
}

console.log(`Start16`)
try {
  run()
} catch(e) {
  console.log(`Error: ${e}`)
}
console.log(`Start17`)
