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
var count = 0;


function init() {
  return new Promise(function(resolve, reject) {
    var i;  
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
        hash: currentBlockHash
      }
      resolve(ledger);
    });
  })
}


function serializeAndSign(tx, privateKey, passPhrase) {
  if (!tx.parentBlockHash) tx.parentBlockHash = currentBlockHash;
  if (!tx.publicKey) tx.publicKey = ''; // TODO: extract from privateKey
  var payload = {
    contract: tx.contract.toString(),
    hash: tx.parentBlockHash.toString(),
    args: tx.args,
    iss: tx.publicKey.toString()
  }
  return createToken(payload, privateKey, passPhrase);
}


function runContractInVm(promiseFn, globals) {
  // TODO: Remove all possible code injection exploits, evil CPU locking code, etc. Into the rabbit hole and beyond.
  var code = 'new Promise(' + promiseFn + ')';
  return safeEval(code, globals);
}


// commitTransaction takes an array of serialized transactions. they can be parsed by parseToken.
function commitTransactions(serializedTransactions) {
  var promises = serializedTransactions.map(function(serializedTransaction) {
    return new Promise(function(resolve, reject) {
      payload = parseToken(serializedTransaction);
      tx = {
        contract: payload.contract,  // contract is promise string, eg: "function(resolve, reject) { ... }"
        parentBlockHash: payload.hash,
        publicKey: payload.iss,
        args: payload.args
      }
      
      if (currentBlockHash == tx.parentBlockHash) return reject("Wrong parent block hash");

      // TODO: pass a ledgerState object that has access control / permissions based on the public key instead a full-access database API
      // TODO: Start ACID transaction (proposal: pg-promise library)
      runContractInVm(tx.contract, Object.assign({ledgerState: ledgerState}, tx.args))
      .then(function(result) {
        count++;
        fs.appendFile(ledgerHistoryFile, serializedTransaction+'\n');
        // TODO: Commit ACID transaction
        // console.log("@"+count+": " + encodedTx)
        resolve(result);
      })
      .catch(function(err) {
        console.error(err.stack);
        // TODO: Rollback ACID transaction
        reject(err);
      })
    })
  })
  
  // Apply all promised transactions
  return Promise.all(promises)
  .then(function() {
    // TODO: calculate hash of the new block
  })
  .catch(function(err) {
    console.error(err.stack);
  })
}

function receiveTransaction(serializedTransaction) {
  // TODO: queue up multiple transactions, wait for consensus, and THEN commit them in one block
  return commitTransactions([serializedTransaction])
}


function sendTransaction(serializedTransaction) {
  // TODO: Network Stuff
  receiveTransaction(serializedTransaction)
}

module.exports = {
  init: init,
  sendTransaction: sendTransaction,
  receiveTransaction: receiveTransaction,
  serializeAndSign: serializeAndSign
}