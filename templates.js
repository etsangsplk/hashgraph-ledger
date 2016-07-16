// This file contains some simple general-purpose contracts that can be deployed to the blockchain.
// a contract is simply a promise body that "promises" to modify
// the ledgerState in a regulated and truthful way.
// The contract MUST NOT use random values

module.exports = {
  // Upon deployment, this contract simply stores a value under a specified identifier.
  // It does not interact with other contracts.
  // Expected arguments: identifier, value
  storeValue: function(resolve, reject) {
    if (caller) throw 'This contract only runs on deployment';
    ledger.update({identifier: identifier}, {$push: {values: value}})
    .then(resolve)
    .catch(reject)
  }
}
