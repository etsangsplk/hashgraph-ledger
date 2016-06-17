/** 
 ** Validate Equity in Stefan Corporation
 */

var crypto = require('crypto');
var http = require('http');
var https = require('https');
var fs = require('fs');
var readline = require('readline');
var validationServer = require('./validationServer');

var passphrase = '';

if (process.argv.length < 3 || process.argv[2] != '--no-passphrase') {
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
     });
    hiddenInput('Enter private keys passphrase (or use --no-passphrase): ', function(input) {
        passphrase = input;
        rl.close();
        start();
    });
 }
 else {
     start();
 }

function createJWT(claims) {
    if (typeof claims === 'undefined') claims = {};
    var headers = {
        "alg": "RS256",
        "typ": "JWT"
    };
    claims.iat = new Date().getTime() / 1000;
    claims.iss = 'https://stefan.co.jp';
    var headerString = new Buffer(JSON.stringify(headers)).toString('base64');
    var claimsString = new Buffer(JSON.stringify(claims)).toString('base64');
    var unsignedToken = headerString + '.' + claimsString;
    var rsa = crypto.createSign('RSA-SHA256');
    rsa.write(unsignedToken);
    rsa.end();
    
    privateKey = fs.readFileSync('./privkey.pem'); // TODO: replace _1 with OAuth2 client_id
    
    var signature = rsa.sign({key: privateKey, passphrase: passphrase}, 'base64');
    return unsignedToken +'.' + signature;
}


function testJWT() {
    var claims = {
        'testclaim': 'testvalue'
    };
    return createJWT(claims);
    
}

function start() {
    var errorMessage = false;
    
    try {
        //testJWT();
    }
    catch (err) {
        if (err.message.indexOf('bad password read') !== -1) {
            errorMessage = 'privkey.pem file requires passphrase. None given.';
        }
        else if (err.message.indexOf('bad decrypt') !== -1) {
            errorMessage = 'Invalid passphrase';
        }
        else if (err.message.indexOf('no such file or directory') !== -1) {
            errorMessage = 'Missing private key file.\nRun "openssl genrsa -out privkey.pem 2048" to generate one';
        }
        else {
            errorMessage = err.message;
        }
    }
    
    if (errorMessage) {
        console.error('Error:', errorMessage);
    }
    else {
        var validationServer = require('./validationServer.js');
        validationServer.run(createJWT);
    }
}

function hiddenInput(query, callback) {
    var stdin = process.openStdin();
    process.stdin.on("data", function(char) {
        char = char + "";
        switch (char) {
            case "\n":
            case "\r":
            case "\u0004":
                stdin.pause();
                break;
            default:
                process.stdout.write("\033[2K\033[200D" + query + Array(rl.line.length+1).join("*"));
                break;
        }
    });

    rl.question(query, function(value) {
        if (rl.history) {
            rl.history = rl.history.slice(1);
        }
        callback(value);
    });
}