var co, createToken, crypto, fs, hiddenInput, readline, rl;

fs = require('fs');
readline = require('readline');
crypto = require('crypto');
co = require('co');

rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

createToken = function(claims, passphrase) {
  var claimsString, headerString, headers, privateKey, rsa, signature, unsignedToken;
  if (typeof claims === 'undefined') {
    claims = {};
  }
  headers = {
    'alg': 'RS256',
    'typ': 'JWT'
  };
  claims.iat = (new Date).getTime();
  claims.nonce = crypto.randomBytes(16).toString('hex');
  claims.iss = 'stefan.co.jp';
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

hiddenInput = function(query, callback) {
  var stdin;
  stdin = process.openStdin();
  process.stdin.on('data', function(char) {
    char = char + '';
    switch (char) {
      case '\n':
      case '\u000d':
      case '\u0004':
        stdin.pause();
      default:
        process.stdout.write('[2K[200D' + query + Array(rl.line.length + 1).join('*'));
        break;
    }
  });
  return rl.question(query, function(value) {
    if (rl.history) {
      rl.history = rl.history.slice(1);
    }
    callback(value);
  });
};

hiddenInput('Enter Passphrase: ', function(input) {
    rl.close();
    var claims, token;
    claims = {
      shares: 500,
      id: 'mynumber:test'
    };
    token = createToken(claims, input);
    console.log(token);
});

