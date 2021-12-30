const hazelCollectibleBase = require('./hazelCollectibleBase');

async function run(){
    try{
        await verifyInitialState();
        await verifyPausing();
        await verifyBaseURIUpdates();
        await verifyMinting();
        await verifyWithdrawal();

        console.log("Execution complete");
    }catch(e){
        console.log("Test failed!");
        console.log(e);
    }      
}

async function verifyInitialState(){
    //verify initial state
    await assertEqual(hazelCollectibleBase.totalSupply(), 0, "Invalid initial total supply");
    await assertEqual(hazelCollectibleBase.maximumSupply(), 30, "Invalid maximum supply");
    await assertEqual(hazelCollectibleBase.getPrice(1), 20, "Invalid price");
    await assertEqual(hazelCollectibleBase.getPrice(2), 40, "Invalid price multiplication");
    await assertEqual(hazelCollectibleBase.paused(), true, "Token should be paused");
    await assertEqual(hazelCollectibleBase.getBaseURI(), "ipfs://baseUri", "Invalid initial baseURI");
    await assertEqual(hazelCollectibleBase.creator(), hazelCollectibleBase.addresses[0], "Invalid dev address");
    await assertEqual(hazelCollectibleBase.developer(), "0xf3c28ca894Bb1a76EFBED5FFE491Ab4cFA836ac9", "Invalid dev address");
    await assertEqual(hazelCollectibleBase.getDevSaleCommission(), 5, "Invalid dev sale commission");
    await assertEqual(hazelCollectibleBase.isPrivateMinting(), false, "Minting should be public");
    await assertEqual(hazelCollectibleBase.canCreatorMintForFree(), false, "Creator should not mint for free");
    //verify creator has no tokens
    await assertEqual(hazelCollectibleBase.tokensOwnedByAddress(hazelCollectibleBase.addresses[0]), [], "Creator should have no tokens");
}

async function verifyPausing(){
      //verify only creator can call pause/unpause methods
      await assertFailWithReason(hazelCollectibleBase.pause(false, "I want to unpause the token", hazelCollectibleBase.addresses[2])
      , "Ownable: caller is not the owner"
      , "Pause should be available to creator only");

      await assertFailWithReason(hazelCollectibleBase.pause(true, "I want to pause the token", hazelCollectibleBase.addresses[2])
      , "Ownable: caller is not the owner"
      , "Pause should be available to creator only");

      //verify creator can pause/unpause token
      var creatorUnpauseTx = await assertTransactionAccepted(hazelCollectibleBase.pause(false, "I want to unpause the token")
      , "Pause not available to creator");
      await assertEqual(hazelCollectibleBase.paused(), false, "Token should not be paused after creator initial unpause");
      await assertEventLaunchedDuringTransaction(creatorUnpauseTx.txHash, "TokenUnpaused", "No event found when token was unpaused");

      var creatorPauseTx = await assertTransactionAccepted(hazelCollectibleBase.pause(true, "I want to pause the token")
      , "Pause not available to creator");
      await assertEqual(hazelCollectibleBase.paused(), true, "Token should be paused after creator pause");
      await assertEventLaunchedDuringTransaction(creatorPauseTx.txHash, "TokenPaused", "No event found when token was paused");

      creatorUnpauseTx = await assertTransactionAccepted(hazelCollectibleBase.pause(false, "I want to unpause the token")
      , "Pause not available to creator");
      await assertEqual(hazelCollectibleBase.paused(), false, "Token should not be paused after creator unpause");
      await assertEventLaunchedDuringTransaction(creatorUnpauseTx.txHash, "TokenUnpaused", "No event found when token was unpaused");
}

async function verifyBaseURIUpdates(){
       //verify only creator can change base URI
       await assertFailWithReason(hazelCollectibleBase.setBaseURI("newBaseUri", "I want to unpause the base URI", hazelCollectibleBase.addresses[2])
       , "Ownable: caller is not the owner"
       , "BaseURI should be updated by creator only");

       var changeBaseUriTx = await assertTransactionAccepted(hazelCollectibleBase.setBaseURI("newBaseUri", "I want to unpause the base URI")
       , "BaseURI should be updated by creator only");
       await assertEqual(hazelCollectibleBase.getBaseURI(), "newBaseUri", "Base uri shold be equal to 'newBaseUri' after update");
       await assertEventLaunchedDuringTransaction(changeBaseUriTx.txHash, "BaseURIChanged", "No event found when baseURI was changed");
}

async function verifyMinting(){
  
    var creator = await hazelCollectibleBase.creator();
    var numberOfTokensToMint = 2;
    var price = await hazelCollectibleBase.getPrice(numberOfTokensToMint);
    var canCreatorMintForFree = await hazelCollectibleBase.canCreatorMintForFree();
    var isPrivateMinting = await hazelCollectibleBase.isPrivateMinting();

    var firstMint;
    if(canCreatorMintForFree){
        firstMint = await assertTransactionAccepted(hazelCollectibleBase.mint(numberOfTokensToMint), "Creator cannot mint first token for free");  
    }else{
        firstMint = await assertTransactionAccepted(hazelCollectibleBase.mint(numberOfTokensToMint, price), "Creator cannot mint first token");  
        await assertFailWithReason(hazelCollectibleBase.mint(numberOfTokensToMint, price - 1)
       , "Message value below minting price"
       , "Creator minted with value less than price");
    }
    await assertEventLaunchedDuringTransaction(firstMint.txHash, "TokenCreated", "No event found when first token was minted");
    await assertEqual(hazelCollectibleBase.totalSupply(), numberOfTokensToMint, "Total supply not equal to 1 after first mint");
    await assertEqual(hazelCollectibleBase.tokensOwnedByAddress(creator), [ 0, 1 ], "Creator should own 0 index token");

    var creatorPauseTx = await assertTransactionAccepted(hazelCollectibleBase.pause(true, "I want to pause the token")
    , "Pause not available to creator");
    await assertEqual(hazelCollectibleBase.paused(), true, "Token should be paused after creator pause");
    await assertEventLaunchedDuringTransaction(creatorPauseTx.txHash, "TokenPaused", "No event found when token was paused");

    if(isPrivateMinting){
        await assertFailWithReason(hazelCollectibleBase.mint(numberOfTokensToMint, price, hazelCollectibleBase.addresses[2])
        , "This is a private sale. Only creator and whitelisted addresses can mint new tokens"
        , "Non whitelisted address minted on private minting");
    }else{
        await assertFailWithReason(hazelCollectibleBase.mint(numberOfTokensToMint, price, hazelCollectibleBase.addresses[2])
        , "Contract is paused"
        , "Non creator address minted while token paused");
    }

    var creatorUnpauseTx = await assertTransactionAccepted(hazelCollectibleBase.pause(false, "I want to unpause the token")
    , "Pause not available to creator");
    await assertEqual(hazelCollectibleBase.paused(), false, "Token should not be paused after creator initial unpause");
    await assertEventLaunchedDuringTransaction(creatorUnpauseTx.txHash, "TokenUnpaused", "No event found when token was unpaused");

    numberOfTokensToMint = 21;
    price = await hazelCollectibleBase.getPrice(numberOfTokensToMint);
    await assertFailWithReason(hazelCollectibleBase.mint(numberOfTokensToMint, price, hazelCollectibleBase.addresses[2])
    , "Requested amount exeeds maximum number of tokens that can be minted within one transaction"
    , "Minted count exceeds maximum transaction count");   

    numberOfTokensToMint = 10;
    price = await hazelCollectibleBase.getPrice(numberOfTokensToMint);

    if(!isPrivateMinting){
        await assertTransactionAccepted(hazelCollectibleBase.mint(numberOfTokensToMint, price, hazelCollectibleBase.addresses[2]), "Non whitelist account cannot mint 10 tokens");  
    }else{
        await assertTransactionAccepted(hazelCollectibleBase.mint(numberOfTokensToMint, price), "Creator account cannot mint 10 tokens");  
    }

    await assertEqual(hazelCollectibleBase.totalSupply(), 2 + numberOfTokensToMint, "Total supply not equal to 12 after second mint");
    await assertEqual(hazelCollectibleBase.tokensOwnedByAddress(hazelCollectibleBase.addresses[2]), [2, 3, 4, 5, 6, 7, 8, 9, 10, 11], "First minter should own 10 tokens");

    numberOfTokensToMint = 18;
    price = await hazelCollectibleBase.getPrice(numberOfTokensToMint);
    await assertTransactionAccepted(hazelCollectibleBase.mintTo(numberOfTokensToMint, hazelCollectibleBase.addresses[1], price), "Creator cannot mintTo second address");  
    await assertEqual(hazelCollectibleBase.tokensOwnedByAddress(hazelCollectibleBase.addresses[1]), [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], "Second address should own 18 tokens");
    await assertEqual(hazelCollectibleBase.totalSupply(), 30, "Total supply not equal to 30 after last mint");

}

async function verifyWithdrawal(){
    await assertTransactionAccepted(hazelCollectibleBase.withdrawAll(), "Creator cannot withdrawal");  
    await assertEqual(hazelCollectibleBase.web3.eth.getBalance(hazelCollectibleBase.hazelCollectibleBaseAddress), 0, "Contract balance not 0 after withdrawal");
}

run();

function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] != b[i]) return false;
    }

    return true;
  }

async function assertEqual(promise, expectedValue, message){
    var value = await promise;
    
    if(Array.isArray(value)){
        if(!arraysEqual(value, expectedValue))
        throw message + "\nExpected Value: " + expectedValue + "\nActual Value: " + value + "\n";
    }else{
        if(value != expectedValue){
            throw message + "\nExpected Value: " + expectedValue + "\nActual Value: " + value + "\n";
        }    
    }
}

async function assertFailWithReason(promise, expectedReason, message){
    var result = await promise;

    if(result.revertReason == undefined){
        throw message + "\nTrasaction accepted: " + result.txHash + "\nGas Used: " + result.gasUsed + "\n";
    }

    var truncatedMessage = result.revertReason
        .replace("Returned error: VM Exception while processing transaction: revert ", "")
        .replace("Returned error: ", "").toLowerCase();
        
    if(truncatedMessage != expectedReason.toLowerCase()){
        throw message + "\nExpected Reason: " + expectedReason + "\nActual Reason: " + result.revertReason + "\n";
    }
}

async function assertTransactionAccepted(promise, message){
    var result = await promise;

    if(result.revertReason != undefined){
        throw message + "\n" + result.revertReason + "\n";
    }
    return result;
}

async function assertEventLaunchedDuringTransaction(tx, eventType, message){
    var events = await hazelCollectibleBase.getEventsForTransaction(tx, eventType);
    var returnValues;
    
    events.forEach(event => {
        returnValues = (event.returnValues);
    });

    if(!returnValues)
        throw message;
}