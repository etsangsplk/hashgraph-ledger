// TODO: use real testing framework
Ledger = require('./ledger');

fs = require('fs');

exploitingContract = 'function(resolve, reject){ derp() }); function derp(){ asdf() };function(){ }'

var testPublicKey = fs.readFileSync('./test_identity_public_key.pem').toString()
var testPrivateKey = fs.readFileSync('./test_identity_private_key.pem').toString()


var tx = {
  contract: require('./simple_contracts.js').storeValue,
  //contract: exploitingContract,
  args: {identifier: 'some_id', value: 'some_value123'},
  publicKey: testPublicKey
}
var serializedTransaction = Ledger.serializeAndSign(tx, testPrivateKey);

var hashgraph = require('hashgraph')({
  database: '',
  publicKey: testPublicKey
});

hashgraph.on('ready', function() {
  hashgraph.sendTransaction(serializedTransaction);
})

hashgraph.on('consensus', function(transactions) {
  Ledger.commitTransactions(transactions);
})
