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
import uuid from 'uuid'

process.env.NODE_ENV = "development"

// Generate a random date between start and end
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

let makePost = async function(idx, body, userId, t) {
  let props = {
    body: `#${idx} copy of ${body}`,
    user_uuid: userId,
    createdAt: randomDate(new Date(1999, 1, 1), new Date()) // between olden days and today
  }
  let id = uuid.v4()
  // console.log(`Save a new post ${props.body} as ${id}`)
  return orm.Post.forge(props).save({uuid: id}, {transacting: t})
}

let run = async function() {
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
      await orm.User.forge(props).save({uuid: user.id})
    } else {
      await u.save(props, {patch: true})
    }
//
    var timeline = await user.getPostsTimeline()
    var t = await orm.Timeline.forge({uuid: timeline.id}).fetch()
    var props = {
      type: 'Posts',
      user_uuid: user.id
    }
    if (!t) {
      return orm.Timeline.forge(props).save({uuid: timeline.id})
    } else {
      return t.save(props, {patch: true})
    }
//
  })

  // for (let timeline of timelines) {
  //   var t = await orm.Timeline.forge({uuid: timeline.id}).fetch()
  //   var props = {
  //     type: 'Posts'
  //   }
  //   if (!t) {
  //     await orm.Timeline.forge(props).save({uuid: timeline.id})
  //   } else {
  //     await t.save(props, {patch: true})
  //   }

    // let posts = await timeline.getPosts(0, 10000000)
    // console.log(`Save timeline ${t.id} posts (${posts.length} posts found)`)

    // orm.Bookshelf.transaction(async function(trx) {
    //   try {
    //     await* posts.map(async function(post) {
    //       var u = await orm.User.forge({uuid: post.userId}).fetch()
    //       // Generate 15000 new posts per source post
    //       // Adjust UUID and posting date
    //       for (let x of _.range(15000)) {
    //         await makePost(x+1, post.body, u.id, trx)
    //       }
    //       console.log(`15000 posts saved`)
    //       return true
    //     })
    //     console.log(`Timeline ${t.id} posts saved`)
    //   } catch(e) {
    //     trx.rollback()
    //   }
    // }).catch(function(e) {
    //   console.log(`Transaction Error: ${e}`)
    //   console.log(e.stack)
    // })
  // }

  console.log('Done.')
  process.exit()
}

run().catch(function(e) {
  console.log(`Error: ${e}`)
  console.log(e.stack)
  process.exit()
})
