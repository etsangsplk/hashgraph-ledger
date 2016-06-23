var useExperimentalBlockchain = true;

var co, createToken, crypto, fs, hiddenInput, readline, rl;

fs = require('fs');
readline = require('readline');
crypto = require('crypto');
co = require('co');
inquirer = require('inquirer');
createToken = require('./jwt').createToken;
Ledger = require('./ledger');

var prompt = inquirer.createPromptModule();
prompt([
  {type: 'password', message: 'Enter passphrase', name: 'passphrase'},
  {type: 'input', message: 'Enter amount of shares', name: 'amount'},
  {type: 'input', message: 'Enter identification', name: 'identifier'},
])
.then(function(answers) {
  var claims, token;
  var iat = parseInt((new Date).getTime() / 1000);
  var jti = crypto.randomBytes(16).toString('hex');
  claims = {
      shares: answers.amount,
      jti: jti,
      iat: iat,
      iss: 'stefan.co.jp'
  };
  token = createToken(claims, './signkey.pem', answers.passphrase);
  unsignedToken = token.split('.')[0] + '.' + token.split('.')[1];
  
  fs.appendFile('issued_shares.csv', iat+','+answers.identifier+','+jti+','+answers.amount+','+unsignedToken+"\n", function(err) {
      if (err) console.error(err.stack);
  })
  console.log(token);
  
  // Store token in blockchain as proof-of-stake
  // TODO: use a "real" blockchain.
  if (useExperimentalBlockchain) {
    var privateKey = fs.readFileSync('./signkey.pem');
    var publicKey  = fs.readFileSync('./verifykey.pem');
    Ledger.init()
    .then(function(ledgerStatus) {
      var tx = {
        contract: require('./simple_contracts.js').storeValue,
        args: {identifier: answers.identifier, value: token},
        publicKey: publicKey
      }
      return Ledger.sendTransaction(Ledger.serializeAndSign(tx, privateKey, answers.passphrase));
    })
    .then(function(result) {
      // TODO: Transaction has been sent (probably. Return meaningful result).
      // TODO: But we don't know if was included in the block or if it was succesful. Find out!
    })
    .catch(function(err) {
      console.error(err.stack);
    })
  }
  
})
.catch(function(err) {
  console.error(err.stack); 
  process.exit(1);
})

