// QuantumLedger Project

// Database that stores the current state. Can be recreated by replaying the history.
var ledgerStateFile = 'ledgerState.txt';

// Stores every transaction ever recorded. Append-only.
var ledgerHistoryFile = 'ledgerHistory.txt';

// Stores the last blockchain hash
var blockHashFile = 'ledgerHash.txt';

var fs = require('fs');
var crypto = require('crypto');
var Datastore = require('nedb');

var ledgerState = new Datastore({filename: ledgerStateFile});
ledgerState.ensureIndex({fieldName: 'identifier', unique: true});
ledgerState.loadDatabase();

var currentBlockHash = fs.readFileSync(blockHashFile);

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
      // commitTransaction takes a function that takes the ledger state as argument and returns a promise.
      // the promise "promises" to modify the ledger in a regulated, truthful way.
      // TODO: refactor to be able to call something like ledger.commitTransaction({contract: fn, parentBlockHash: int, publicKey: pk, signature: sign...})
      var commitTransaction = function(tx) {
        return new Promise(function(resolve, reject) {
          var txFn = tx.fn;
          if (currentBlockHash != tx.parentBlockHash) reject("Wrong parent block hash");
          // TODO: validate signature 
          var encodedTx = Buffer.from(txFn.toString()).toString('hex'); // TODO: encode entire tx object
          fs.appendFile(ledgerHistoryFile, encodedTx+'\n'); // Gotta love javascript
          // TODO: ensure that the transaction only modifies things/values (JWTs) that the public key has "access" to. dont pass ledgerState that allows any operation.
          txFn(ledgerState).then(function(result) {
            count++;
            // TODO: calculate and save new hash
            console.log("@"+count+": " + encodedTx)
            resolve(result);
          })
          .catch(function(err) {
            console.error(err.stack);
            // TODO: Rollback changes to ledgerState here
            reject(err)
          })
        })
      }
      var ledger = {
        index: count,
        hash: currentBlockHash,
        storeValue: function(identifier, value) {
          var txFn = function(ledgerState) {
            return new Promise(function(resolve, reject) {
              ledgerState.update({identifier: identifier}, {$push: {values: value}}, {upsert: true}, function() {
                ledgerState.findOne({identifier: identifier}, function(err, result) {
                  if (err) reject(err);
                  else resolve(result);
                })
              })
            })
          }
          var tx = {
            fn: txFn,
            parentBlockHash: currentBlockHash
          }
          return commitTransaction(addSignature(tx));
        }
      }
      resolve(ledger);
    });
  })
}

// TODO: implement this
function addSignature(tx, privateKey, passPhrase) {
  tx.signature = '';
  return tx;
}

module.exports = {init: init}