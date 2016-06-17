# Stefan Corporation

Stefan Corporation (ステファン株式会社, sutefuan kabushikikaisha) is the first company in the world to issue and trade cryptographically signed company shares (kabushiki) that are regulated by a government body (Japan).

Issued shares contain a JSON web token that embed the amount of shares as the claim payload.

It is planned to integrate the issuance of these kind of shares into a blockchain network. The technology base has not been decided yet.

Stefan Corporation is registering the JWT claim name `shares` to store the amount of shares held by the subscriber with the IETF.

The code in this repository contains tools to issue, validate and trade company shares (kabushiki).

You can validate a share on the [JWT website](http://jwt.io) using the following public key

    -----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAojjKH5tGflndQLj0T2i5
    Fg24XLKShgjVgERoq8A2LDyheLiKtru2ThKTagWJ6hgc4U5CsqJdofBldyF21h+0
    jbe6zrm/RzYADgSINtzdM7j1WpcgJo8BsNCyqY/0LhpffToF3kmg1SVM6fUMYMrE
    hiLs+lFHK3iNmvz6Zg5TBP2+zPguys0v+Ff/pFT4zkMlRSxJcsRcg5yzI9wnkf7i
    6lV1BNWijKRq+abEJKrr6gooFtZ1nxVdukdQvJJiC6I7mizX5C98nKN9govUF0Am
    4JNxYVIuMkgdY0TYMDQmtJHevD7HTTL7G2cXO6IKmpkoCdgPQC+2U122ZswMcPCU
    dwIDAQAB
    -----END PUBLIC KEY-----
    

# JWT `shares` claim name specification

The claim name `shares` shall be used to specify the amount of shares a stake holder of a company referenced in the "iss" claim is claiming to be owning. This value shall only be applicable if the "iss" value can be resolved to a host using standard DNS lookup methods and the host provides sufficient information to uniquely identify the legal entity (company) referenced in the "iss" claim.

# Become a shareholder

There are several ways to become a shareholder. Visit http://stefan.co.jp for more information.
