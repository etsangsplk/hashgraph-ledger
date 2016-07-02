var crypto = require('crypto');
var fs = require('fs');

module.exports = {
  // TODO: be careful. this comes from the scary internet.
  parseToken: function(token, publicKey) {
    var parts = token.split('.');
    var header = parts[0];
    var claims = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    var signature = parts[2];
    if (!publicKey) publicKey = claims.iss;
    
    var verifier = crypto.createVerify('RSA-SHA256');
    var valid = verifier.verify(publicKey, signature, 'base64');
    if (!valid) throw 'Invalid Signature';
    
    return claims;
  },
  createToken: function(claims, privateKey, passphrase) {
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
    if (fs.existsSync(privateKey)) privateKey = fs.readFileSync(privateKey);
    signature = rsa.sign({
      key: privateKey,
      passphrase: passphrase
    }, 'base64');
    return unsignedToken + '.' + signature;
  }
}
