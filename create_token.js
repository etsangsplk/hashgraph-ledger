var crypto = require('crypto');
var fs = require('fs');

module.exports = createToken = function(claims, passphrase) {
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
  privateKey = fs.readFileSync('./signkey.pem');
  signature = rsa.sign({
    key: privateKey,
    passphrase: passphrase
  }, 'base64');
  return unsignedToken + '.' + signature;
};
