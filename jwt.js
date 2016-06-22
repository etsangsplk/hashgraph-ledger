var crypto = require('crypto');
var fs = require('fs');

module.exports = {
  // be careful. this comes from the scary internet.
  parseToken: function(token, publicKey) {
    var parts = token.split('.');
    var header = parts[0];
    var claims = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    var signature = Buffer.from(parts[2], 'base64').toString();
    var publicKey = publicKey ? publicKey : claims.publicKey;
    
    // TODO: throw error if signature does not match publicKey
    return claims;
  },
  createToken: function(claims, privateKeyFile, passphrase) {
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
    privateKey = fs.readFileSync(privateKeyFile);
    signature = rsa.sign({
      key: privateKey,
      passphrase: passphrase
    }, 'base64');
    return unsignedToken + '.' + signature;
  }
}
