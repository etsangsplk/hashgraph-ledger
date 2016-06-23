# Stefan.co.jp

The code in this repository contains the source to the [Stefan Corporation Website](https://stefan.co.jp) and tools to issue regulated company shares (kabushiki) as values that can be stored in a blockchain. It also contains code for an experimental new blockchain technology called QuantumLedger.

#### What is this about?

Stefan Corporation (ステファン株式会社, sutefuan kabushiki gaisha) is an IT and Security Consulting company founded in Japan, and is the first company in the world to issue and trade cryptographically signed company shares (kabushiki) regulated by a government body utilizing blockchain technology. 

Issued shares take the form of JSON web tokens that embed the amount of shares in the claim payload. These tokens can be created offline using code in this repository and can be stored inside a blockchain.

The blockchain technology that will be responsible to store the tokens has not been decided yet. Stefan Corporation is currently researching and developing a new javascript-based blockchain called `QuantumLedger`. This experimental blockchain is still in the early stages and uses [RFC 4716](https://tools.ietf.org/html/rfc4716#section-3.4) public keys for addressing purposes.

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
    

#### JWT `shares` claim name specification

Stefan Corporation is registering the JWT claim name `shares` to store the amount of shares held by the subscriber with the IETF.

The claim name `shares` shall be used to specify the amount of shares a stake holder of a company referenced in the `iss` claim is claiming to be owning. This value shall only be applicable if the `iss` claim value can be resolved to a host using standard DNS lookup methods and the host provides sufficient information to uniquely identify the legal entity (company) referenced in the `iss` claim.

#### Become a shareholder

There are several ways to become a shareholder. Visit http://stefan.co.jp for more information.

## QuantumLedger

The QuantumLedger is an experimental blockchain written completely in javascript. Contracts in QuantumLedger are just javascript promises that live inside a virtual machine. The contracts have access to transaction arguments and the parts of the ledger that are controlled by or have explicitly been granted access to the contract's owner. An owner is defined by a public key.

### Key Generation

Run the following commands to create a public/private keypair that you can use with QuantumLedger:

    openssl genrsa -out private_key.pem 2048
    openssl rsa -in private_key.pem -pubout -out public_key.pem
    
If you want to protect your private key with a passphrase, use:

    openssl genrsa -passout pass:mypassphrase -out private_key.pem 2048
    openssl rsa -in private_key.pem -passin pass:mypassphrase -pubout -out public_key.pem
    
NOTE: If your private key file gets compromised or you lose the passphrase, it will become impossible to claim your stakes stored in the ledger.

### Contracts

A QuantumLedger contract is just a javascript promise body. Read more about javascript promises [here](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise).

    function myContract(resolve, reject) { ... }
    
Inside the contract you have access to the `ledgerState` variable and transaction arguments. They live in the global namespace of the VM that is executing the contract code.

A contract execution can end in four ways:

  - resolve() is called
  - reject() is called
  - the contract terminates without calling either resolve() nor reject()
  - contract fulfillment takes too long and the consensus decides to destroy it

A contract should not attempt to modify the ledger after it called resolve() or reject(). For changes to the ledger state to be permanent, a contract has to call resolve(result) with a `result` variable that is not `undefined`. Note that the storage engine currently does not support ACID transaction, meaning changes to the the ledger are currently not rolled back if a contract terminates without calling resolve(). We are exploring using postgres as data backend because the postgres transaction scheme fits perfectly onto the javascript promises mechanism.

Note: At this point in time, the API to interact with the ledger state from within the contract is neither secure nor finalized and still highly experimental. We are providing a library of simple, general-purpose contracts in the [simple_contracts.js](https://github.com/buhrmi/stefan.co.jp/blob/master/simple_contracts.js) file.

### Transactions

A transaction changes the ledger in some way.

A transaction can be executed like this (networking not implemented yet).
    
    Ledger = require('./ledger');
    
    Ledger.init()
    .then(function(ledgerStatus) {
      
      var tx = {
        contract: myContract,
        parentBlockHash: ledgerStatus.currentBlockHash,
        args: { /* args to pass to the contract*/}
      }
      
      var serializedTransaction = Ledger.serializeAndSign(tx, './path_to_private_key.pem', 'passphrase');
      
      // At this point, the transaction is just a signed string. Sending it to a node on the network is not implemented yet.
      // This will execute the transaction only on the local database.
      return Ledger.sendTransaction(serializedTransaction);
      
    })
    .then(function(result) {
      // TODO: Check if transaction has been executed in the next block.  
    })
    
