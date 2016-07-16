# Hashgraph

This is a [hashgraph](https://en.wikipedia.org/wiki/Hashgraph) implementation written in javascript. It is currently in development and not yet ready to be used.

## Hashgraph Network

The Hashgraph Network is an experimental distributed ledger written in javascript on top of the hashgraph. It is a network of interconnected peers that work together to maintain consensus over the state of a distributed ledger. The list of participating node can be dynamic, and nodes can join and leave the network as they please without causing overhead.

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

## Get Started

You can use hashgraph for any javascript project that is run on several nodes that require some kind of consensus. For example for a replicated log, or state machine.

### Install Hashgraph

First, install the hashgraph package.

    npm install hashgraph --hashgraph
    
### Key Generation

Each node in the hashgraph requires its own public/private keypair. It is using standard [RFC 4716](https://tools.ietf.org/html/rfc4716#section-3.4) keys.

Run the following commands to create a public/private keypair:

    openssl genrsa -out private_key.pem 2048
    openssl rsa -in private_key.pem -pubout -out public_key.pem
    
If you want to protect your private key with a passphrase, use:

    openssl genrsa -passout pass:mypassphrase -out private_key.pem 2048
    openssl rsa -in private_key.pem -passin pass:mypassphrase -pubout -out public_key.pem
    
NOTE: Do not lose your private key file or forget your passphrase. If you do, you will lose all value stored under your public key.

### Set up a node

Once you created your keys, you can set up a node and optionally join another node on the network very easily. 

    var myPublicKey = fs.readFileSync('./public_key.pem').toString();
    var myPrivateKey = fs.readFileSync('./private_key.pem').toString();
    
    var hashgraph = require('hashgraph')({
      database: 'postgresql://localhost/hashgraph',
      publicKey: myPublicKey,
      privateKey: myPrivateKey,
      passphrase: 'somePassPhrase' // optional
    });
    
    // Optionally, join another node on the network
    hashgraph.join(someIPv6Address);

### Maintain consensus

After joining another node on the network you can submit transactions to the network like this:

    hashgraph.on('ready', function() {
      hashgraph.sendTransaction('somePayload');
    })
    
After the transaction has been sent to the network, it will try to achieve consensus over the question where to place this transaction in the global order of all transactions in the network. Once consensus has been achieved, the hashgraph will emit an event that you can listen to:

    hashgraph.on('consensus', function(transactions) {
      // Apply transactions to state machine
    })

This is all you need to know to use hashgraph with your own projects. Read on for information on how to use the hashgraph ledger.

## Hashgraph Ledger

The hashgraph network includes a state machine that can handle contracts written in javascript. Read on.

### Contracts

A contract on is just a javascript promise body. Read more about javascript promises [here](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise).

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

A contract should not attempt to modify the ledger after it called resolve() or reject(). If a contract should be considered fulfilled, it has to call resolve(result) . `result` may not be undefined. Note that the storage engine currently does not support ACID transactions, meaning changes to the the ledger are not rolled back if a contract terminates without calling resolve(). We are exploring using postgres as data backend because the postgres transaction scheme fits perfectly onto the javascript promises mechanism.

Note: At this point in time, the API to interact with the network state from within the contract is neither secure nor finalized and still highly experimental. We are providing a library of simple, general-purpose contracts in the [simple_contracts.js](https://github.com/buhrmi/consensus/blob/master/simple_contracts.js) file.

### Transactions

A transaction changes the network state or the ledger in some way.

A transaction can be executed like this.
    
    var myPublicKey = fs.readFileSync('./public_key.pem').toString()
    var myPrivateKey = fs.readFileSync('./private_key.pem').toString()
    
    Ledger = require('./ledger');
    Hashgraph = require('./hashgraph');
    
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

    
# Stefan.co.jp

The code in this repository currently also contains the source for the [Stefan Corporation Website](https://stefan.co.jp) and tools to issue regulated company shares (kabushiki) with cryptographic values that can be stored and tracked inside a distributed database.

### What is this about?

Stefan Corporation (ステファン株式会社, sutefuan kabushiki gaisha) is an IT and Security Consulting company founded in Japan, and is the first company in the world to issue and trade cryptographically signed, regulated company shares (kabushiki). 

Issued shares take the form of JSON web tokens that embed the amount of shares in the claim payload. These tokens can be created offline using code in this repository and can be stored inside a blockchain or hashgraph.

The blockchain technology that will be responsible to store the tokens has not been decided yet. Stefan Corporation is currently researching and developing a new javascript-based hashgraph called `Consensus Network`. This experimental hashgraph is still in the early stages and uses [RFC 4716](https://tools.ietf.org/html/rfc4716#section-3.4) public keys for addressing purposes.

At the same time, alternative efforts are underway to research the feasability to store the shares inside the [Hyperledger Fabric](http://github.com/hyperledger/fabric) using a smart contract implemented in [chaincode](https://github.com/hyperledger/fabric/blob/master/docs/API/SandboxSetup.md). This smart contract contains a list of public keys (addresses) and the shares (stake) that belong to this address. A collaborative project proposal can be found [here](https://docs.google.com/document/d/1YQ69FXUXAhw30LlJ4t5RFG4KxsCkvpu1oqpgqBZVr14/edit?usp=sharing). 

Currently, shareholders can validate a Stefan Corporation share on the [JWT website](http://jwt.io) using the following public key

    -----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAojjKH5tGflndQLj0T2i5
    Fg24XLKShgjVgERoq8A2LDyheLiKtru2ThKTagWJ6hgc4U5CsqJdofBldyF21h+0
    jbe6zrm/RzYADgSINtzdM7j1WpcgJo8BsNCyqY/0LhpffToF3kmg1SVM6fUMYMrE
    hiLs+lFHK3iNmvz6Zg5TBP2+zPguys0v+Ff/pFT4zkMlRSxJcsRcg5yzI9wnkf7i
    6lV1BNWijKRq+abEJKrr6gooFtZ1nxVdukdQvJJiC6I7mizX5C98nKN9govUF0Am
    4JNxYVIuMkgdY0TYMDQmtJHevD7HTTL7G2cXO6IKmpkoCdgPQC+2U122ZswMcPCU
    dwIDAQAB
    -----END PUBLIC KEY-----
    
As long as the hashgraph network has not been launched, shares are stored in the [captable.csv](https://github.com/buhrmi/consensus/blob/master/captable.csv) file. They will be transfered to the network when the decision has been made.

### JWT claim name specification

Stefan Corporation is using the JWT claim name `shares` to store the amount of shares held by the subscriber.

The claim payload is a JSON object similar to

    {
        shares: 1,
        sub: 'stefan.co.jp',
        iss: public key,
        jti: a unique identifier,
        iat: a unix timestamp specifying the date of issuance
    }

The claim name `shares` is used to specify the amount of shares a stake holder of an entity referenced in the `iss` claim is owning. The value of the `sub` claim should be resolvable to a host using standard DNS lookup methods and the host should provide sufficient information via HTTP to uniquely identify the legal entity (company) referenced in the `iss` claim and the host should make the public key retrievable via HTTP.

### Become a shareholder

There are several ways to become a shareholder. Visit http://stefan.co.jp for more information.

### Can my company use this to issue shares?

Yes. All you have to do is to register your public key with your government. The easiest way to do this is to amend the articles of incorporation to include the public key and provide a notarized public record. As long as the hashgraph network is not available, shares are being stored in the `captable.csv` file. After you have created your own key files (see section on key generation), you can then simply issue shares by running `node allot.js`. This will add your shares to the `captable.csv` file. Please submit a pull request with the updated `captable.csv`. In the pull request comment, please provide a link where you have publicized the articles of incorporation including your public key.
