import { PgSubscription } from 'meteor/numtel:pg'


const subscriptions = {};

export const subscribe = function(collection, subName, kwargs) {
  const key = subName + "-" + JSON.stringify(kwargs);
  const sub = subscriptions[key] || new PgSubscription(subName, kwargs);
  subscriptions[key] = sub;
  sub.addEventListener('update.' + key, function(diff, data) {
    const idKey = collection.pgTableName + '_id';
    if(diff.removed) {
      diff.removed.forEach(function(item) {
        collection.remove({_index: item._index});
      })
    }
    if(diff.added) {
      let selector = {}
      diff.added.forEach(function(item) {
        if(item[idKey]) {
          selector[idKey] = item[idKey]
          collection.upsert(selector, {$set: item});
        }
      })
    }

  })
  sub.depend()
  return sub;
}
