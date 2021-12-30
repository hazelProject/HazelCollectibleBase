const HazelCollectibleBase = artifacts.require("HazelCollectibleBase");

module.exports = function(deployer) {
  deployer.deploy(HazelCollectibleBase, 
    "HazelCollectibleBase",  //token name
    "HCB", // token symbol
    "ipfs://baseUri", // baseURI
    30, // maximum supply
    20, // price
    20, // maximum tokens minted within one transaction
    '0xf3c28ca894Bb1a76EFBED5FFE491Ab4cFA836ac9', // dev address
    5, // dev sale commission
    false, // is private minting
    false // creator can mint for free
    );
};
