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
var createToken = require('./jwt').createToken;
var parseToken = require('./jwt').parseToken;
var safeEval = require('safe-eval')

var ledgerState = new Datastore({filename: ledgerStateFile});
ledgerState.ensureIndex({fieldName: 'identifier', unique: true});
ledgerState.loadDatabase();

var currentBlockHash = fs.readFileSync(blockHashFile).toString();

var sendTransaction, receiveTransaction;

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
      // commitTransaction takes an array of serialized transactions. they can be parsed by parseToken.
      var commitTransactions = function(serializedTransactions) {
        var promises = serializedTransactions.map(function(serializedTransaction) {
          return new Promise(function(resolve, reject) {
            payload = parseToken(serializedTransaction);
            tx = {
              fn: safeEval(payload.fn),  // fn is a function
              parentBlockHash: payload.hsh,
              publicKey: payload.iss,
              args: payload.args
            }
            // TODO: validate tx.publickey against signature of serializedTransaction
            if (currentBlockHash != tx.parentBlockHash) reject("Wrong parent block hash");
            fs.appendFile(ledgerHistoryFile, serializedTransaction+'\n'); // Gotta love javascript
            // TODO: ensure that the transaction only modifies things/values (JWTs) that the public key has "access" to. dont pass ledgerState that allows any operation.
            tx.fn(ledgerState, tx.args).then(function(result) {
              count++;
              // console.log("@"+count+": " + encodedTx)
              resolve(result);
            })
            .catch(function(err) {
              console.error(err.stack);
              // TODO: Rollback changes to ledgerState here
              reject(err)
            })
          })
        })
        
        // Apply all promised transactions
        Promise.all(promises)
        .then(function() {
          // TODO: calculate hash of the new block
        })
        .catch(function(err) {
          console.error(err.stack);
        })
      }
      receiveTransaction = function(serializedTransaction) {
        // TODO: queue up multiple transactions, wait for consensus, and THEN commit them in one block
        return commitTransactions([serializedTransaction])
      }
      sendTransaction = function(serializedTransaction) {
        // TODO: Network Stuff
        
        receiveTransaction(serializedTransaction)
      }
      var ledger = {
        index: count,
        hash: currentBlockHash,
        storeValue: function(identifier, value) {
          var txFn = require('./simple_contracts.js').storeValue;
          var tx = {
            fn: txFn,
            args: {identifier: identifier, value: value},
            parentBlockHash: currentBlockHash
          }
          return sendTransaction(signAndSerialize(tx, './test_identity_private_key.pem'));
        }
      }
      resolve(ledger);
    });
  })
}

function signAndSerialize(tx, privateKeyFile, passPhrase) {
  var payload = {
    fn: tx.fn.toString(),
    hsh: tx.parentBlockHash,
    args: tx.args,
    iss: '' // TODO: set to public key (extract from privateKey)
  }
  return createToken(payload, privateKeyFile, passPhrase);
}

module.exports = {
  init: init,
  sendTransaction: sendTransaction,
  receiveTransaction: receiveTransaction
}