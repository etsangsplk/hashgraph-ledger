# Stefan Corporation

Stefan Corporation (ステファン株式会社, sutefuan kabushikikaisha) is the first company in the world to issue and trade cryptographically signed company shares (kabushiki) regulated by a government body (Japan) utilizing blockchain technology.

Issued shares take the form of JSON web tokens that embed the amount of shares in the claim payload. These tokens can be created offline using code in this repository and can be stored inside a blockchain.

The blockchain technology base to support the storage has not been decided yet. The current proposal is to develop or modify a codebase to use standard hashed RSA-SHA256 public keys created with open ssl tools as addresses (as opposed to proprietary key formats used in bitcoin). The huge benefit of this approach is that this allows one to secure the private key with a passphrase and store it inside the actual blockchain without a security risk (given a strong non-bruteforcable password). That way, users can interact with the blockchain without the need for a wallet file or online wallet service.

The code in this repository contains tools to issue, validate and trade company shares (kabushiki).

You can validate a Stefan Corporation share on the [JWT website](http://jwt.io) using the following public key

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

## Moving company assets into the blockchain

In principle, it requires three steps:

1. Key Creation: The person authorized to transfer assets (usually the company representative) creates an encrypted signature key.
2. Identification: The holders (legal entities) of company assets are identified and are assigned a unique identifier.
3. Transfer: The person authorized to transfer the assets creates signed tokens and stores them in the blockchain. The holders receive printed certificates containing the JWT and share amount.

#### 1. Key Creation

The key creation process is the same as creating a standard SSL private and public key pair. The private key is the signature key and the public key becomes the verification key. Technical instructions coming soon.

#### 2. Identification

// TODO

#### 3. Transfer

// TODO

## Become a shareholder

There are several ways to become a shareholder. Visit http://stefan.co.jp for more information.
