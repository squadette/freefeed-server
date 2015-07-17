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
  var app = express()
  var app = await environment.init(app)
  var database = redis.connect()

  var usernames = await database.keysAsync('username:*')
  var userIds = await* usernames.map((username) => database.getAsync(username))
  var users = await* userIds.map((userId) => models.FeedFactory.findById(userId))
  var timelines = await* users.map((user) => user.getPostsTimeline())

  await* users.map(async function(user) {
    var u = await orm.User.forge({uuid: user.id}).fetch()
    var props = {
      username: user.username,
      screenName: user.screenName,
      hashedPassword: user.hashedPassword,
      email: user.email,
      isPrivate: user.isPrivate,
      type: user.type,
      // createdAt: user.createdAt,
      // updatedAt: user.updatedAt,
      deletedAt: null,
      tokens: {},
      bans: []
    }
    if (!u) {
      console.log(`Save a new user ${user.username}`)
      return orm.User.forge(props).save({uuid: user.id})
    } else {
      console.log(`Update existing user ${user.username}`)
      return u.save(props, {patch: true})
    }
  })
  console.log(`Users saved`)

  await* timelines.map(async function(timeline) {
    var t = await orm.Timeline.forge({uuid: timeline.id}).fetch()
    var props = {
      type: 'Posts'
    }
    if (!t) {
      console.log(`Save a new timeline ${timeline.id}`)
      await orm.Timeline.forge(props).save({uuid: timeline.id})
    } else {
      console.log(`Update existing timeline ${timeline.id}`)
      await t.save(props, {patch: true})
    }
    console.log(`Timeline ${t.id} saved`)

    let posts = await timeline.getPosts(0, 10)
    console.log(`Save timeline posts`)
    await* posts.map(async function(post) {
      var p = await orm.Post.forge({uuid: post.id}).fetch()
      var props = {
        body: post.body,
        // user: post.userId // @todo
      }
      if (!p) {
        console.log(`Save a new post ${post.body}`)
        return orm.Post.forge(props).save({uuid: post.id})
      } else {
        console.log(`Update existing post ${post.body}`)
        return p.save(props, {patch: true})
      }
    })
    console.log(`Posts saved`)
    return true
  })
  console.log(`Timelines saved`)

  console.log('Done.')
  process.exit()
}

run().catch(function(e) { console.log(`Error: ${e}`) })
