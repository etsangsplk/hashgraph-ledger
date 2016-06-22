// This file contains some sample contracts that can be deployed to the blockchain.
// a QuantumLedger Contract is a function that takes the ledgerState and an object containing additional arguments
// It returns a promise that "promises" to modify the ledgerState in a regulated and truthful way
// The contract MUST NOT use random values

module.exports = {
  // This contract expects two transaction arguments: identifier and value
  storeValue: function(resolve, reject) {
    ledgerState.update({identifier: identifier}, {$push: {values: value}}, {upsert: true}, function() {
      ledgerState.findOne({identifier: identifier}, function(err, result) {
        if (err) reject(err);
        else resolve(result);
      })
    })
  }
}