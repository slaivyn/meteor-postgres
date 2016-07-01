import { EventEmitter }         from 'events';
import { Meteor }               from 'meteor/meteor';
import { pg as nodePg, LivePg } from 'meteor/numtel:pg';
const CHANNEL = 'meteor_channel';

class MyEmitter extends EventEmitter {}

export const pg = new MyEmitter();

const pgConnectionAttempt = function(pgConfig, maxRetry) {
  return new Promise((fulfill, reject) => {
    const pgClient = new nodePg.Client(pgConfig);
    pgClient.connect((err, res) => {
      if(err) {
        return reject(err)
      } else {
        return fulfill(pgClient)
      }
    })
  })
  .catch((err) => {
    console.error(err)
    maxRetry--;
    if(maxRetry == 0)
      throw new Error();
    return pgConnectionAttempt(pgConfig, maxRetry)
  })
  .then((pgClient) => {
    pg.client = pgClient;
    return pgConfig;
  })
}

const mainDb   = Meteor.settings.database.master;
const backupDb = Meteor.settings.database.backup;
pgConnectionAttempt(mainDb, 2)
.catch((err) => {
  return pgConnectionAttempt(backupDb, 2)
})
.then((pgConfig) => {
  pg.client.querySync = Meteor.wrapAsync(pg.client.query, pg.client);
  pg.liveDb = new LivePg(pgConfig, CHANNEL)
  pg.liveDb.on('error', (error) => {
    console.log("pg connection error", error)
  });
  pg.emit('connected');
  const closeAndExit = function() {
    pg.liveDb.cleanup(process.exit);
  }
  // Close connections on hot code push
  process.on('SIGTERM', closeAndExit);
  // Close connections on exit (ctrl + c)
  process.on('SIGINT', closeAndExit);
})
.catch((err) => {
  console.error(error)
  throw new Error("Impossible to connect to any database...")
})


export const publish = function(queryStr) {
  const query = pg.liveDb.select(queryStr)
  query.on("error", function(error) {
    console.log(error)
  })
  return query;
}
