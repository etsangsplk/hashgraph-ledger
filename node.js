var dgram = require('dgram');
var fs = require('fs');
var Ledger = require('./ledger');

var publicKey = fs.readFileSync('./public_key.pem').toString()

var knownNodes = {}
var socket = dgram.createSocket('udp6');

var defaultOptions = {
  port: 41234
}
var setup = function(_options) {
  var options = Object.assign({}, defaultOptions, _options);
  var port = options.port;

  // When this gets really big... What happens?
  knownNodes[publicKey] = 'localhost:' + port

  socket.bind(port);

  socket.on('error', function(err) {
    console.log(`socket error:\n${err.stack}`);
    socket.close();
  });
  
  return new Promise(function(resolve, reject) {
    socket.on('listening', function() {
      var address = socket.address();
      console.log(`socket listening ${address.address}:${address.port}`);
      Ledger.init()
      .then(function() {
        socket.on('message', function (data, fn) {
          // TODO: analyze payload. check if it's malicious (the tx might lock up the VM etc)
          // TODO: consensus algorithm, decide what transactions to execute in what order.
          var transactions = []
          transactions.push(data.toString());
          Ledger.commitTransactions(transactions);
        });
        resolve();
      })
    });
  })
}

// Hashgraph Consensus Algorithm
// The following is an attempt to implement algorithm defined in white paper by Leemon Baird
// http://www.swirlds.com/wp-content/uploads/2016/06/SWIRLDS-TR-2016-01.pdf
function gossip() {
  // TODO: 'finalize' current event
  // TODO: pick random node
  // TODO: find events that we think that node does not know
  // TODO: send all the events to the node
}

function receiveGossip() {
  // TODO: merge received events with hashgraph in memory
  // TODO: create new event proving receipt of gossip
  // TODO: 'open up' that event to record new transactions
  consensus();
}

function consensus() {
  // TODO: divideRounds
  // TODO: decideFame
  // TODO: findOrder
  // TODO: apply all transactions of events which's order was calculated
}

// This is called locally (not from the network) when the user wants to add transaction
function newTransaction() {
  // TODO: if there is no 'current recording event', create new event
  // TODO: record the transaction onto the event
  // TODO: after a while, gossip the event
  // TODO: as soon as consensus is reached on the order of this event, apply the transactions
}



module.exports = {
  setup: setup,
  addOtherNode: function(publicKey, ip6) {
    knownNodes[publicKey] = ip6;
  },
  sendTransaction: function(transaction) {
    var promises = []
    for (publicKey in knownNodes) {
      promises.push(new Promise(function(resolve) {
        var host = knownNodes[publicKey];
        var ip = host.substr(0, host.lastIndexOf(':'));
        var port = host.substr(host.lastIndexOf(':') + 1);
        socket.send(transaction, port, ip, resolve)
      }))
    }
    return Promise.all(promises);
  }
}


// if (process.argv[2] == '--leader') {
//   
// }
// else {
//   
// }
// 
// var Liferaft = require('liferaft');
// QuantumNode = LifeRaft.extend({
//   write: function write(packet, callback) {
//     socket.write(JSON.stringify(packet));
//   },
//   initialize: function initialize(options) {
//     // stuff?
//   }
// })
// raft = new LifeRaft();
// 
// raft.on('state change', function(state) {
//   console.log(Liferaft.states[state])
// })
// 
// socket.on('message', function (data, fn) {
//   console.log('got data:' + data)
//   raft.emit('data', data, fn);
// });
