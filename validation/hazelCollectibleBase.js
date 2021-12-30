const Web3 = require('web3');
const gasLimit = 6721975;

const web3 = new Web3('http://127.0.0.1:7545');   

const hazelCollectibleBaseAddress = '';
const abi = require('../build/contracts/HazelCollectibleBase.json').abi; 
const pausableAbi = require('../build/contracts/Pausable.json').abi; 
    
const hcb = new web3.eth.Contract(abi, hazelCollectibleBaseAddress);
const pausable = new web3.eth.Contract(pausableAbi, hazelCollectibleBaseAddress);

var address0 = ''; //should be contract creator address
var address1 = '';
var address2 = '';

const addresses = [ address0, address1, address2 ];

const totalSupply = async function(){
    return await hcb.methods.totalSupply().call({}, function(error, data){ return getPayload(error, data) });
}

const maximumSupply = async function(){
    return await hcb.methods.maximumSupply().call({}, function(error, data){ return getPayload(error, data) });
}

const maximumTransactionCount = async function(){
    return await hcb.methods.maximumTransactionCount().call({}, function(error, data){ return getPayload(error, data) });
}

const creator = async function(){
    return await hcb.methods.creator().call({}, function(error, data){ return getPayload(error, data) });
}

const developer = async function(){
    return await hcb.methods.developer().call({}, function(error, data){ return getPayload(error, data) });
}

const getDevSaleCommission = async function(){
    return await hcb.methods.getDevSaleCommission().call({}, function(error, data){ return getPayload(error, data) });
}

const isPrivateMinting = async function(){
    return await hcb.methods.isPrivateMinting().call({}, function(error, data){ return getPayload(error, data) });
}

const canCreatorMintForFree = async function(){
    return await hcb.methods.canCreatorMintForFree().call({}, function(error, data){ return getPayload(error, data) });
}

const getBaseURI = async function(){
    return await hcb.methods.getBaseURI().call({}, function(error, data){ return getPayload(error, data) });
}

const isAddressWhitelisted = async function(address){
    return await hcb.methods.isAddressWhitelisted(address).call({}, function(error, data){ return getPayload(error, data) });
}

const tokensOwnedByAddress = async function(address){
    return await hcb.methods.tokensOwnedByAddress(address).call({}, function(error, data){ return getPayload(error, data) });
}

const getPrice = async function(count){
    return await hcb.methods.getPrice(count).call({}, function(error, data){ return getPayload(error, data) });
}

const paused = async function(){
    return await pausable.methods.paused().call({}, function(error, data){ return getPayload(error, data) });
}

const mint = async function(count, val, sender){
    var params = {
        from: sender != undefined ? sender : address0, 
        value: val != undefined ? val : 0, 
        gas: gasLimit
    };

    try{
        await hcb.methods.mint(count).send(params, async function(error, result) {
            r = await getTransactionIdAndGasUsage(error, result);
        });   
    }catch{}
    
    return r;
}

const mintTo = async function(count, recipient, val, sender){
    var params = {
        from: sender != undefined ? sender : address0, 
        value: val != undefined ? val : 0, 
        gas: gasLimit
    };
    try{
        await hcb.methods.mintTo(count, recipient).send(params, async function(error, result) {
            r = await getTransactionIdAndGasUsage(error, result);
        });  
    }catch{}
   
    return r; 
}

const setBaseURI = async function(baseURI, reason, sender){
    try{
        await hcb.methods.setBaseURI(baseURI, reason).send({from: sender != undefined ? sender : address0, gas: gasLimit}, async function(error, result) {
            r = await getTransactionIdAndGasUsage(error, result);
        });   
    }catch{}
   
    return r;
}

const pause = async function(paused, reason, sender){
    try{
        await hcb.methods.pause(paused, reason).send({from: sender != undefined ? sender : address0, gas: gasLimit}, async function(error, result) {
            r = getTransactionIdAndGasUsage(error, result);
        });  
    }catch{}
   
    return r;
}

const withdrawAll = async function(sender){
    try{
        await hcb.methods.withdrawAll().send({from: sender != undefined ? sender : address0, gas: gasLimit}, async function(error, result) {
            r = await getTransactionIdAndGasUsage(error, result);
        });   
    }catch{}
   
    return r;
}

const getLastEvent = async function(){
    return (await hcb.getPastEvents()).pop();
}

const getEventsForTransaction = async function(txHash, eventType){
    var currentBlock = await web3.eth.getBlockNumber();
    var events = await hcb.getPastEvents({eventType,
        fromBlock : 0,
        toBlock: currentBlock
    });
    var results = [];
    events.forEach(event => {
        if(event.transactionHash == txHash){
            results.push(event);
        }
    });
    return results;
}

async function getTransactionIdAndGasUsage(exception, hash){
    if(exception)
        return { revertReason : exception.message };

    var receipt = await web3.eth.getTransactionReceipt(hash);
    return { txHash : receipt.transactionHash, gasUsed : receipt.gasUsed };
}

function getPayload(error, data){
    if(error){
        console.log(error);
        throw '';
    }   
    return data;       
}

module.exports ={
    totalSupply,
    maximumSupply,
    tokensOwnedByAddress,
    getPrice,
    paused,
    mint,
    mintTo,
    setBaseURI,
    pause,
    withdrawAll,
    getLastEvent,
    getEventsForTransaction,
    maximumTransactionCount,
    creator,
    developer,
    getDevSaleCommission,
    isPrivateMinting,
    canCreatorMintForFree,
    getBaseURI,
    isAddressWhitelisted,
    web3,
    hazelCollectibleBaseAddress,
    addresses
}

