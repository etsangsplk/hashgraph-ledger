var co, createToken, crypto, fs, hiddenInput, readline, rl;

fs = require('fs');
readline = require('readline');
crypto = require('crypto');
co = require('co');
inquirer = require('inquirer');


createToken = function(claims, passphrase) {
  var claimsString, headerString, headers, privateKey, rsa, signature, unsignedToken;
  if (typeof claims === 'undefined') {
    claims = {};
  }
  headers = {
    'alg': 'RS256',
    'typ': 'JWT'
  };
  headerString = new Buffer(JSON.stringify(headers)).toString('base64');
  claimsString = new Buffer(JSON.stringify(claims)).toString('base64');
  unsignedToken = headerString + '.' + claimsString;
  rsa = crypto.createSign('RSA-SHA256');
  rsa.write(unsignedToken);
  rsa.end();
  privateKey = fs.readFileSync('./privkey.pem');
  signature = rsa.sign({
    key: privateKey,
    passphrase: passphrase
  }, 'base64');
  return unsignedToken + '.' + signature;
};

var prompt = inquirer.createPromptModule();
prompt([
  {type: 'password', message: 'Enter passphrase', name: 'passphrase'},
  {type: 'input', message: 'Enter amount of shares', name: 'amount'},
  {type: 'input', message: 'Enter identification', name: 'identifier'},
]).then(function(answers) {
  var claims, token;
  console.log(answers);
  var iat = (new Date).getTime();
  var nonce = crypto.randomBytes(16).toString('hex');
  claims = {
      shares: answers.amount,
      nonce: nonce,
      iat: iat,
      iss: 'stefan.co.jp'
  };
  token = createToken(claims, answers.passphrase);
  unsignedToken = token.split('.')[0] + token.split('.')[1];
  fs.appendFile('issued_shares.csv', iat+','+answers.identifier+','+nonce+','+answers.amount+','+unsignedToken+"\n", function(err) {
      console.error('Error appending to issued_shares.csv');
  })
  console.log(token);
})
.catch(function(err) {console.error(err.stack); process.exit(1);})

