import { PgSubscription } from 'meteor/numtel:pg'


const subscriptions = {};

export const subscribe = function(collection, subName, kwargs) {
  const key = subName + "-" + JSON.stringify(kwargs);
  const sub = subscriptions[key] || new PgSubscription(subName, kwargs);
  subscriptions[key] = sub;
  sub.addEventListener('update.' + key, function(diff, data) {
    const idKey = collection.primaryKey || collection.pgTableName + '_id';
    /*if(diff.moved) {
      diff.moved.forEach(function(item) {
        collection.update({_index: item.old_index}, {$set: {_index: item.new_index}});
      })
    }*/
    if(diff.removed) {
      diff.removed.forEach(function(item) {
        collection.remove({_index: item._index});
      })
    }
    if(diff.added) {
      let selector = {}
      diff.added.forEach(function(item) {
        const _id = item[idKey];
        if(_id) {
          selector[idKey] = _id
          const dbItem = collection.findOne(selector)
          //console.log(idKey, _id, dbItem, item.code_insee)
          if(!dbItem) {
            collection.insert(item)
          } else {
            let different = false;
            for(const key of Object.keys(item)) {
              if(key === '_index')             continue;
              if(typeof item[key] == 'object') continue;
              if(dbItem[key] == item[key])     continue;
              
              different = true;
              break;
            }
            if(different) {
              collection.update(selector, {$set: item})
            }
          }
        }
      })
    }

  })
  sub.depend()
  return sub;
}
