var useExperimentalBlockchain = false;

var fs = require('fs');
var readline = require('readline');
var crypto = require('crypto');
var co = require('co');
var inquirer = require('inquirer');
var createToken = require('./jwt').createToken;

var privateKey = fs.readFileSync('./private_key.pem').toString();
var publicKey  = fs.readFileSync('./public_key.pem').toString();

var prompt = inquirer.createPromptModule();
prompt([
  {type: 'password', message: 'Enter passphrase', name: 'passphrase'},
  {type: 'input', message: 'Enter amount of shares', name: 'amount'},
  {type: 'input', message: 'Enter identifier (receiver of shares)', name: 'identifier'},
])
.then(function(answers) {
  var claims, token;
  var iat = parseInt((new Date).getTime() / 1000);
  var jti = crypto.randomBytes(16).toString('hex');
  claims = {
      shares: answers.amount,
      jti: jti,
      iat: iat,
      sub: 'stefan.co.jp',
      iss: publicKey
  };
  token = createToken(claims, privateKey, answers.passphrase);
  
  fs.appendFile('captable.csv', iat+','+answers.identifier+','+jti+','+answers.amount+','+token+"\n", function(err) {
      if (err) console.error(err.stack);
  })
  console.log(token);
  
  // Store token in blockchain as proof-of-stake
  if (useExperimentalBlockchain) {
    var Ledger = require('./ledger');
    var hashgraph = require('hashgraph')();
    
    var tx = {
      contract: require('./simple_contracts.js').storeValue,
      args: {identifier: answers.identifier, value: token},
      publicKey: publicKey
    }
    
    var serializedTransaction = Ledger.serializeAndSign(tx, privateKey, answers.passphrase);
    
    hashgraph.on('ready', function() {
      hashgraph.sendTransaction(serializedTransaction);
    }
    
    hashgraph.on('consensus', function(transactions) {
      Ledger.commitTransactions(transactions);
    })
  }
  
})
.catch(function(err) {
  console.error(err.stack); 
  process.exit(1);
})
