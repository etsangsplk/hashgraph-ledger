// TODO: use real testing framework
Ledger = require('./ledger');
fs = require('fs');

exploitingContract = 'function(resolve, reject){ derp() }); function derp(){ asdf() };function(){ }'

var testPublicKey = fs.readFileSync('./test_identity_public_key.pem').toString()
var testPrivateKey = fs.readFileSync('./test_identity_private_key.pem').toString()

Ledger.init()
.then(function(ledgerStatus) {
  var tx = {
    contract: require('./simple_contracts.js').storeValue,
    //contract: exploitingContract,
    args: {identifier: 'some_id', value: 'some_value123'},
    publicKey: testPublicKey
  }
  return Ledger.sendTransaction(Ledger.serializeAndSign(tx, testPrivateKey));
})
.then(function(result) {
  // TODO: Transaction has been sent (probably. Return meaningful result).
  // TODO: But we don't know if was included in the block or if it was succesful. Find out!
})
.catch(function(err) {
  console.error(err.stack);
})


var identity = Ledger.identity(testPrivateKey, testPublicKey)