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
ledgerState.ensureIndex({fieldName: '__publicKey'});
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
  
  // TODO: start new ACID Transaction
  return safeEval(code, globals)
  .then(function(result) {
    // TODO: commit transaction
    return Promise.resolve(result);
  })
  .catch(function(err) {
    // TODO: rollback transaction
    throw err;
  });
  
}

// XXX: This is not final at all. TODO: Switch to postgres using pg-promise
function getLedgerInterface(database, publicKey) {
  // Update variables of contract
  var update = function(select, updates, callback) {
    return new Promise(function(resolve, reject) {
      if (!updates.$set) updates.$set = {}
      delete updates.__publicKey;
      delete updates.__type;
      delete updates.__contract;
      if (updates.$set) {
        delete updates.$set.__publicKey;
        delete updates.$set.__type;
        delete updates.$set.__contract;
      }
       // XXX: there might be more vectors of changing private keys. switch to a different method.
      select.__publicKey = publicKey;
      database.update(select, updates, {upsert: true}, function(err, numUpdated) {
        if (err) reject(err);
        else resolve(numUpdated);
      });
    })
  }
  // Interact with another contract
  var call = function(contractKey, args) {
    return new Promise(function(resolve, reject) {
      var contract = database.findOne({__publicKey: otherPublicKey, __type: 'contract'}, function(err, result) {
        if (err) throw err;
        var ledgerInterface = getLedgerInterface(ledgerState, otherPublicKey);
        resolve(runContractInVm(result.__contract, Object.assign(args, {ledger: ledgerInterface, caller: publicKey})))
      })
    })
  }
  return {
    update: update
  }
}

// commitTransaction takes an array of serialized transactions. they can be parsed by parseToken.
function commitTransactions(serializedTransactions) {
  var promises = serializedTransactions.map(function(serializedTransaction) {
    return new Promise(function(resolve, reject) {
      payload = parseToken(serializedTransaction); // Also verifies publicKey embedded in transaction Token
      
      tx = {
        contract: payload.contract,  // contract is promise string, eg: "function(resolve, reject) { ... }"
        parentBlockHash: payload.hash,
        publicKey: payload.iss,
        args: payload.args
      }
      
      if (currentBlockHash != tx.parentBlockHash) throw "Wrong parent block hash";
      
      // Save contract in blockchain
      ledgerState.update({__publicKey: tx.publicKey, __type: 'contract'}, {$set: {__contract: tx.contract}}, {upsert: true})
      
      var ledgerInterface = getLedgerInterface(ledgerState, tx.publicKey);
      
      runContractInVm(tx.contract, Object.assign(tx.args, {ledger: ledgerInterface, caller: null}))
      .then(function(result) {
        count++;
        fs.appendFile(ledgerHistoryFile, serializedTransaction+'\n');
        // console.log("@"+count+": " + encodedTx)
        resolve(result);
      })
      .catch(reject)
    })
  })
  
  // Apply all promised transactions
  return Promise.all(promises)
  .then(function() {
    // TODO: calculate and save hash of the new block
  })
  .catch(function(err) {
    console.error(err);
    throw err;
  })
}

module.exports = {
  init: init,
  commitTransactions: commitTransactions,
  serializeAndSign: serializeAndSign
}
