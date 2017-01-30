# Hashgraph Ledger

(NOTE: This code is not working yet. Don't use it.)

The Hashgraph Ledger is an experimental network running on top of the [hashgraph](http://github.com/buhrmi/hashgraph). It is a network of interconnected peers that work together to maintain consensus over the state of a distributed ledger. Currently, the list of participating nodes needs to be configured manually. But some efforts are underway to find a way to allow joining and leaving without causing large overhead.

To maintain consensus, the network employs a new consensus algorithm called hashgraph consensus. This algorithm exploits knowledge of other peers' knowledge about events (similar to "blocks" in traditional blockchains) and uses virtual voting that does not require any extra bandwidth. Hashgraph network is therefore far superior to any blockchain-based network that require some kind of proof-of-X.

The Hashgraph Network provides a distributed ledger implementation that has the following properties:

  - no user registrations or "accounts" required
  - no root account or central authority
  - no native currency
  - no genesis ledger
  - fairness
  - byzantine
  - efficient (no mining)
  - ACID

Contracts on the Hashgraph Network are just javascript promises that live inside a virtual machine and may or may not resolve at any time. They can modify ledger state and call contracts deployed by other users in the network. A contract owner is defined by a public key.

## Contracts

A contract on the hashgraph ledger is just a javascript promise body. Read more about javascript promises [here](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise).

    var myContract = function(resolve, reject) {
      ledger.doSomething().then(resolve);
    }
    
The following variables are accessible through the global scope of the contract VM:

  - `ledger`: The interface to interact with the ledger managed by the consensus network. Note that this interface is not finalized and therefore not yet documented.
  - `caller`: The public key of the calling contract. undefined during deployment context.
  - arguments passed to the contract

A contract execution can end in four ways:

  - resolve() is called
  - reject() is called
  - the contract terminates without calling either resolve() nor reject()
  - contract fulfillment takes too long and the consensus decides to destroy it

A contract should not attempt to modify the ledger after it called resolve() or reject(). If a contract should be considered fulfilled, it has to call resolve(result) . `result` may not be undefined. Note that the storage engine currently does not support ACID transactions, meaning changes to the the ledger are not rolled back if a contract terminates without calling resolve(). I am currently exploring using postgres as data backend because the postgres transaction scheme fits perfectly onto the javascript promises mechanism.

Note: At this point in time, the API to interact with the network state from within the contract is neither secure nor finalized and still highly experimental. There is a library of simple, general-purpose contracts in the [templates.js](https://github.com/buhrmi/hashgraph-ledger/blob/master/templates.js) file.

## Transactions

A transaction changes the network state or the ledger in some way.

A transaction can be executed like this.
    
    var myPublicKey = fs.readFileSync('./public_key.pem').toString()
    var myPrivateKey = fs.readFileSync('./private_key.pem').toString()
    
    Ledger = require('hashgraph-ledger');
    Hashgraph = require('hashgraph');
    
    hashgraph = Hashgraph({
      database: 'postgresql://localhost/hashgraph',
      publicKey: myPublicKey,
      privateKey: myPrivateKey,
      passphrase: 'somePassPhrase' // optional
    })
    
    var tx = {
      contract: myContract,
      args: { /* args to pass to the contract*/ },
      publicKey: myPublicKey
    }
    
    // Turn the transaction into a string, ready to be sent over the network.
    var serializedTransaction = Ledger.serializeAndSign(tx, myPrivateKey, 'passphrase');
    
    hashgraph.on('ready', function() {
      // This will send the transaction to the hashgraph network, and will attempt to build a consensus.
      hashgraph.sendTransaction(serializedTransaction);
    })
    
    hashgraph.on('consensus', function(transactions) {
      Ledger.commitTransactions(transactions);
    })
