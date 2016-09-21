// This file contains some simple general-purpose contracts that can be deployed to the ledger.
// a contract is simply a promise body that "promises" to modify the ledger in a way
// A contract has to be "pure", meaning that given a ledger, it has to modify the ledger in the same way regardless of time or location of execution 

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
