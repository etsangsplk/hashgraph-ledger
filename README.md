# QuantumLedger

The QuantumLedger is an experimental hashgraph written completely in javascript. It is in active development and not yet ready to be used.

Hashgraph is a consensus algorithm that assumes knowledge of other peers' knowledge about events (similar to "blocks" in traditional blockchains) and uses virtual voting that does not require any extra bandwidth. Hashgraph technology is still not very well understood by large parts of the community but seems far superior to blockchain-based technologies. Hashgraph has good chances to obsolete all blockchain-based networks.

QuantumLedger provides only one implementation of hashgraph that is best described by features it does NOT have:

  - no enrollment
  - no member service
  - no user registrations or "accounts"
  - no root account or central authority
  - no native currency
  - no "fuel"
  - no certificate authority

Contracts on QuantumLedger are just javascript promises that live inside a virtual machine and may or may not resolve at any time. They can modify ledger state and call contracts deployed by other users in the network. A contract owner is defined by a public key.

## Key Generation

Run the following commands to create a public/private keypair that you can use with QuantumLedger:

    openssl genrsa -out private_key.pem 2048
    openssl rsa -in private_key.pem -pubout -out public_key.pem
    
If you want to protect your private key with a passphrase, use:

    openssl genrsa -passout pass:mypassphrase -out private_key.pem 2048
    openssl rsa -in private_key.pem -passin pass:mypassphrase -pubout -out public_key.pem
    
NOTE: If your private key file gets compromised or you lose the passphrase, it will become impossible to claim your stakes stored in the ledger.

## Contracts

A QuantumLedger contract is just a javascript promise body. Read more about javascript promises [here](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise).

    var myContract = function(resolve, reject) {
      ledger.doSomething().then(resolve);
    }
    
The following variables are accessible through the global scope of the contract VM:

  - `ledger`: The interface to interact with the ledger state. Note that this interface is not finalized and therefore not yet documented.
  - `caller`: The public key of the calling contract. undefined during deployment context.
  - arguments passed to the contract

A contract execution can end in four ways:

  - resolve() is called
  - reject() is called
  - the contract terminates without calling either resolve() nor reject()
  - contract fulfillment takes too long and the consensus decides to destroy it

A contract should not attempt to modify the ledger after it called resolve() or reject(). If a contract should be considered fulfilled, it has to call resolve(result) . `result` may not be undefined. Note that the storage engine currently does not support ACID transactions, meaning changes to the the ledger are not rolled back if a contract terminates without calling resolve(). We are exploring using postgres as data backend because the postgres transaction scheme fits perfectly onto the javascript promises mechanism.

Note: At this point in time, the API to interact with the ledger state from within the contract is neither secure nor finalized and still highly experimental. We are providing a library of simple, general-purpose contracts in the [simple_contracts.js](https://github.com/buhrmi/quantumledger/blob/master/simple_contracts.js) file.

## Transactions

A transaction changes the ledger in some way.

A transaction can be executed like this.
    
    var myPublicKey = fs.readFileSync('./public_key.pem').toString()
    var myPrivateKey = fs.readFileSync('./private_key.pem').toString()
    
    Ledger = require('./ledger');
    Node = require('./node');
    
    Node.setup()
    .then(function() {
      
      var tx = {
        contract: myContract,
        args: { /* args to pass to the contract*/ },
        publicKey: myPublicKey
      }
      
      // Turn the transaction into a string, ready to be sent over the network.
      var serializedTransaction = Ledger.serializeAndSign(tx, myPrivateKey, 'passphrase');
      
      // This will send the transaction to all known nodes, including the local node.
      return Node.sendTransaction(serializedTransaction);
      
    })
    .then(function(result) {
      // TODO: Check if transaction has been executed in the next block.  
    })

## Nodes

The QuantumLedger Network is supposed to be a public network of nodes exchanging signed transactions and maintaining consensus over the state over the replicated ledger. However, a consensus mechanism is currently not implemented and networking is only rudimentary and not based on any whitepaper. It's definitely not "production ready". The QuantumLedger Network only supports IPv6.

To run a local node, simply run

    Node.setup({port: 41234})

To add another node to the known network, run

    Node.addOtherNode(publicKey, address, port)

To send a transaction into the network run

    Node.sendTransaction(tx)
    
Note that the network currently sends the transaction as a simple UDP datagram to all known nodes. There is no guarantee that the transaction actually reaches other nodes. 

When starting a node for the first time, it will not have any information about the state of the ledger and should sync up with the rest of the network before executing contracts. To do this, we use the hashgraph consensus algorithm. The implementation of this is a currently ongoing effort.

# Stefan.co.jp

The code in this repository will also contain the source to the [Stefan Corporation Website](https://stefan.co.jp) and tools to issue regulated company shares (kabushiki) with cryptographic values that can be stored and tracked, for example in a blockchain or hashgraph. 

### What is this about?

Stefan Corporation (ステファン株式会社, sutefuan kabushiki gaisha) is an IT and Security Consulting company founded in Japan, and is the first company in the world to issue and trade cryptographically signed, regulated company shares (kabushiki). 

Issued shares take the form of JSON web tokens that embed the amount of shares in the claim payload. These tokens can be created offline using code in this repository and can be stored inside a blockchain or hashgraph.

The blockchain technology that will be responsible to store the tokens has not been decided yet. Stefan Corporation is currently researching and developing a new javascript-based hashgraph called `QuantumLedger`. This experimental hashgraph is still in the early stages and uses [RFC 4716](https://tools.ietf.org/html/rfc4716#section-3.4) public keys for addressing purposes.

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
    
While the blockchain or hashgraph technology has not been decided, shares are stored in the [issued_shares.csv](https://github.com/buhrmi/quantumledger/blob/master/issued_shares.csv) file. They will be transfered to the network when the decision has been made.

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

Yes. All you have to do is to register your public key with your government. The easiest way to do this is to amend the articles of incorporation to include the public key and provide a notarized public record. As long as the hashgraph network is not available, shares are being stored in the `issued_shares.csv` file. After you have created your own key files (see section on key generation), you can then simply issue shares by running `node allot.js`. This will add your shares to the `issued_shares.csv` file. Please submit a pull request with the updated `issued_shares.csv`. In the pull request comment, please provide a link where you have publicized the articles of incorporation including your public key.
