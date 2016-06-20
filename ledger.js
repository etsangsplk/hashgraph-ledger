var fs = require('fs');
var Datastore = require('nedb');

// Database that stores the current state. Can be recreated by replaying the history.
var ledgerFile = 'ledger.db';
var ledgerState = new Datastore({filename: ledgerFile});
ledgerState.ensureIndex({fieldName: 'identifier', unique: true});
ledgerState.loadDatabase();

// Saves raw transactions in order to replay history. Line Number = LedgerIndex
var ledgerHistoryFile = 'ledgerHistory.txt'

function init() {
  return new Promise(function(resolve, reject) {
    var i;
    var count = 0;
    // This is just to count the current ledger index
    fs.createReadStream(ledgerHistoryFile)
    .on('error', function(err) { reject(err) })
    .on('data', function(chunk) {
      for (i=0; i < chunk.length; ++i) {
        if (chunk[i] == 10) count++;
      }
    })
    .on('end', function() {
      var ledger = {
        index: count,
        // TODO: make 'commitTransaction' either private or safe (somehow)
        // commitTransaction takes a function that takes the ledger state as argument and returns a promise.
        // the promise "promises" to modify the ledger in a regulated, truthful way.
        // TODO: refactor to be able to call something like ledger.commitTransaction({contract: fn, parent: int, publicKey: pk, signature: sign...})
        commitTransaction: function(transaction) {
          return new Promise(function(resolve, reject) {
            // TODO: add and verify parent ledger hash to ensure correct order of TX
            var encodedTx = Buffer.from(transaction.toString()).toString('hex');
            fs.appendFile(ledgerHistoryFile, encodedTx+'\n'); // Gotta love javascript
            // TODO: ensure that the transaction only modifies values (JWTs) that match the callers public key
            transaction(ledgerState).then(function(result) {
              count++;
              console.log("@"+count+": " + encodedTx)
              resolve(result);
            })
            .catch(function(err) {
              console.error(err.stack);
              // TODO: Rollback changes to ledgerState here
              reject(err)
            })
          })
        },
        storeValue: function(identifier, value) {
          return ledger.commitTransaction(function(ledgerState) {
            return new Promise(function(resolve, reject) {
              ledgerState.update({identifier: identifier}, {$push: {values: value}}, {upsert: true}, function() {
                ledgerState.findOne({identifier: identifier}, function(err, result) {
                  if (err) reject(err);
                  else resolve(result);
                })
              })
            })
          })
        }
      }
      resolve(ledger);
    });
  })
}

module.exports = {init: init}