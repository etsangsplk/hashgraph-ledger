var getBasicAuth = require('basic-auth');
var http = require('http');
var https = require('https');
var URL = require('url');
var fs = require('fs');
var qs = require('querystring');
var crypto = require('crypto');
var Promise = require("bluebird");

var server = {
    run: function(tokenMaker) {
        createJWT = tokenMaker;
        server = http.createServer(requestHandler);
        server.on('clientError', function(err, socket) {
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        });
        server.listen(8080);
        console.log('Listening on port 8080...');
    }
};
module.exports = server;

function requestHandler(request, response) {
    var url = URL.parse(request.url, true);
    if (url.pathname === '/validate') {
        var token, redirect;
        var auth = getBasicAuth(request);
        if (auth) {
            token = auth.token;
        }
        if (url.query.token) token = url.query.token;
        if (url.query.redirect) redirect = url.query.redirect;
        
        var body = '';
        request.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                request.connection.destroy();
        });

        request.on('end', function () {
            var post = qs.parse(body);
            if (post.token) token = post.token;
            if (post.redirect) redirect = post.redirect;
            
            // TODO: Parse claims from token

            var createdToken = createJWT(parsedClaims);
            
            if (createdToken !== token) {
                console.log('Invalid token ', token);
                response.writeHead(400);
                response.end('HTTP/1.1 400 Bad Request\r\n\r\n')
            }
            else {

                console.log('Valid token: ', token);
                var result = {
                    "access_token": token,
                    "client_id": parsedClaims,
                    "scope": null,
                    "expires": null
                };
                if (redirect && (redirect.endsWith('.stefan.co.jp') || redirect === 'stefan.co.jp')) {
                    response.writeHead(302, {'Location': redirect+'?token='+token});
                    response.end();
                }
                else {
                    response.writeHead(200, {'Content-Type': 'application/json'});                    
                    response.end(JSON.stringify(result));
                }
            }
        });
    }
    else if (url.pathname === '/') {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(fs.readFileSync('index.html'));
    }
    else {
        response.writeHead(404);
        response.end('HTTP/1.1 404 Not Found\r\n\r\n');
    }
}