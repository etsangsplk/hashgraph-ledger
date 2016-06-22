// TODO: use real testing framework
Ledger = require('./ledger');

Ledger.init()
.then(function(ledgerStatus) {
  var tx = {
    contract: require('./simple_contracts.js').storeValue,
    args: {identifier: 'some_id', value: 'some_value123'},
    parentBlockHash: ledgerStatus.currentBlockHas
  }
  return Ledger.sendTransaction(Ledger.serializeAndSign(tx, './test_identity_private_key.pem'));
})
.then(function(result) {
  // TODO: Transaction has been sent (probably. Return meaningful result).
  // TODO: But we don't know if was included in the block or if it was succesful. Find out!
})
.catch(function(err) {
  console.error(err.stack);
})