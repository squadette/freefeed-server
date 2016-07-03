import bluebird from 'bluebird'

global.Promise = bluebird
global.Promise.onPossiblyUnhandledRejection((e) => { throw e; });

import { postgres, dbAdapter } from './app/models'

async function main(){
  console.log("Started")
  await postgres.raw('truncate user_stats restart identity cascade')
  let userIds = await getAllUsersIds(postgres)
  let payloads = getStatsPayloads(userIds)
  await postgres('user_stats').insert(payloads)
  for (let id of userIds){
    await dbAdapter.calculateUserStats(id)
  }
}

async function getAllUsersIds(db){
  let res = await db('users').select('uid')
  return res.map((r)=> r.uid )
}

function getStatsPayloads(userIds) {
  return userIds.map((id)=> {
    return {user_id: id}
  })
}

main().then(()=> {
  console.log("Finished")
  process.exit(0)
})