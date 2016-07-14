import bluebird from 'bluebird'
import knexjs from 'knex'
import _ from 'lodash'
import { public_posts as mysql_config } from './knexfile'
import { postgres, dbAdapter, Timeline } from './app/models'

global.Promise = bluebird
global.Promise.onPossiblyUnhandledRejection((e) => { throw e; });

const mysql = knexjs(mysql_config)

const START_DATE = '2016-04-26 00:00:00'

function timestampToDateStr(timestamp) {
  const d = new Date()
  d.setTime(timestamp)
  return d.toISOString()
}

async function getPostApiResponse(postUUID) {
  const res = await mysql('freefeed_urls').select('body').where('url', '=', `/v1/posts/${postUUID}?maxComments=all`)
  const savedApiResponse = res[0].body
  return JSON.parse(savedApiResponse)
}

async function postExist(postUUID) {
  const res = await postgres('posts').where('uid', postUUID)
  const attrs = res[0]

  return !!attrs
}

async function createPost(savedPostData, postJson) {
  const post = {
    uid:               savedPostData.uuid,
    body:              savedPostData.body,
    created_at:        savedPostData.createdat,
    updated_at:        savedPostData.updatedat,
    comments_disabled: postJson.commentsDisabled === '1',
    user_id:           postJson.createdBy
  }

  post.destination_feed_ids = await dbAdapter.getTimelinesIntIdsByUUIDs(postJson.postedTo)
  post.feed_ids = post.destination_feed_ids

  return postgres('posts').insert(post)
}

async function createComment(postUUID, commentJson) {
  const comment = {
    uid:        commentJson.id,
    body:       commentJson.body,
    created_at: timestampToDateStr(commentJson.createdAt),
    updated_at: timestampToDateStr(commentJson.updatedAt),
    post_id:    postUUID,
    user_id:    commentJson.createdBy
  }

  return postgres('comments').insert(comment)
}


async function createPostComments(postUUID, payload) {
  const commentsDescr = payload.comments
  if (!commentsDescr) {
    return
  }

  //console.log(commentsDescr)
  for (const comment of commentsDescr) {
    await createComment(postUUID, comment)
    await publishPostAfterComment(postUUID, comment.createdBy)
  }
}

async function createLike(postUUID, postCreatedAt, userUUID) {
  const like = {
    post_id:    postUUID,
    user_id:    userUUID,
    created_at: postCreatedAt
  }

  return postgres('likes').insert(like)
}


async function createPostLikes(postUUID, payload) {
  const likes = payload.posts.likes
  const postCreatedAt = timestampToDateStr(payload.posts.createdAt)
  if (!likes) {
    return
  }

  //console.log(likes)
  for (const userUUID of likes) {
    await createLike(postUUID, postCreatedAt, userUUID)
    await publishPostAfterLike(postUUID, userUUID)
  }
}

async function createAttachment(postUUID, attachmentJson) {
  const url = attachmentJson.url
  const fileExt = url.substr(url.lastIndexOf('.') + 1)
  const attachment = {
    uid:            attachmentJson.id,
    created_at:     timestampToDateStr(attachmentJson.createdAt),
    updated_at:     timestampToDateStr(attachmentJson.updatedAt),
    file_name:      attachmentJson.fileName,
    file_size:      attachmentJson.fileSize,
    mime_type:      '',
    media_type:     attachmentJson.mediaType,
    file_extension: fileExt,
    no_thumbnail:   true,
    image_sizes:    attachmentJson.imageSizes,
    artist:         attachmentJson.artist,
    title:          attachmentJson.title,
    user_id:        attachmentJson.createdBy,
    post_id:        postUUID
  }

  return postgres('attachments').insert(attachment)
}


async function createPostAttachments(postUUID, payload) {
  const attachmentsDescr = payload.attachments
  if (!attachmentsDescr) {
    return
  }

  //console.log(attachmentsDescr)
  for (const attachment of attachmentsDescr) {
    await createAttachment(postUUID, attachment)
  }
}

async function publishPost(postUUID) {
  const post = await dbAdapter.getPostById(postUUID)
  //console.log(post)

  return Timeline._republishPost(post)
}


async function publishPostAfterComment(postUUID, commenterUserId) {
  const post = await dbAdapter.getPostById(postUUID)
  const user = await dbAdapter.getUserById(commenterUserId)

  let timelineIntIds = post.destinationFeedIds.slice()

  const moreTimelineIntIds = await post.getCommentsFriendOfFriendTimelineIntIds(user)
  timelineIntIds.push(...moreTimelineIntIds)

  timelineIntIds = _.uniq(timelineIntIds)

  let timelines = await dbAdapter.getTimelinesByIntIds(timelineIntIds)

  const bannedIds = await user.getBanIds()
  timelines = timelines.filter((timeline) => !(timeline.userId in bannedIds))

  const feedsIntIds = timelines.map((t) => t.intId)
  const insertIntoFeedIds = _.difference(feedsIntIds, post.feedIntIds)

  if (insertIntoFeedIds.length > 0) {
    await dbAdapter.insertPostIntoFeeds(insertIntoFeedIds, postUUID)
  }
}

async function publishPostAfterLike(postUUID, likerUserId) {
  const post = await dbAdapter.getPostById(postUUID)
  const user = await dbAdapter.getUserById(likerUserId)

  let timelineIntIds = post.destinationFeedIds.slice()

  const moreTimelineIntIds = await post.getLikesFriendOfFriendTimelineIntIds(user)
  timelineIntIds.push(...moreTimelineIntIds)

  timelineIntIds = _.uniq(timelineIntIds)

  let timelines = await dbAdapter.getTimelinesByIntIds(timelineIntIds)

  // no need to post updates to rivers of banned users
  const bannedIds = await user.getBanIds()
  timelines = timelines.filter((timeline) => !(timeline.userId in bannedIds))

  const feedsIntIds = timelines.map((t) => t.intId)
  const insertIntoFeedIds = _.difference(feedsIntIds, post.feedIntIds)

  if (insertIntoFeedIds.length > 0) {
    await dbAdapter.insertPostIntoFeeds(insertIntoFeedIds, post.id)
  }
}


async function processPost(savedPostData, currentPost, postsCount) {
  const postUUID = savedPostData.uuid
  try {
    const exist = await postExist(postUUID)
    if (exist) {
      return
    }

    console.log(`Processing post (${currentPost} of ${postsCount})`, postUUID)

    const apiPostResponse = await getPostApiResponse(postUUID)

    if (!apiPostResponse || apiPostResponse.err) {
      console.log('No response for post', postUUID)
      return
    }

    await createPost(savedPostData, apiPostResponse.posts)

    await publishPost(postUUID)

    await createPostComments(postUUID, apiPostResponse)

    await createPostLikes(postUUID, apiPostResponse)

    await createPostAttachments(postUUID, apiPostResponse)
  } catch (e) {
    console.log('-------------------------------------------------------')
    console.log(e)
    console.log('-------------------------------------------------------')
  }
}

async function main() {
  console.log('Started')
  const newPosts = await mysql('freefeed_posts').where('createdat', '>', START_DATE)

  const postsCount = newPosts.length
  let currentPost = 1

  for (const p of newPosts) {
    await processPost(p, currentPost, postsCount)
    currentPost += 1
  }
}

main().then(() => {
  console.log('Finished')
  process.exit(0)
})
