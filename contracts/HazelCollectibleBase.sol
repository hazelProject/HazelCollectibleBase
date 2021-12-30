// SPDX-License-Identifier: MIT
// HazelCollectibleBase version 1.0.0

pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract HazelCollectibleBase is Ownable, ERC721Enumerable, ERC721Burnable, ERC721Pausable {
    
    using Counters for Counters.Counter;

    Counters.Counter internal _tokenIdTracker;

    uint256 internal immutable _maximumSupply;
    uint256 internal immutable _price;
    uint256 internal immutable _maximumTransactionCount;
    
    address internal immutable _creatorAddress;
    address internal immutable _devAddress;
    uint256 internal immutable _devSaleCommission;

    bool internal immutable _isPrivateMinting;
    bool internal immutable _creatorCanMintForFree;

    string internal _baseTokenURI;

    mapping(address => bool) internal _whitelist;

    event TokenCreated(uint256 indexed id);
    event BaseURIChanged(string oldURI, string newURI, string reason);
    event TokenPaused(string reason);
    event TokenUnpaused(string reason);

    constructor(
        string memory tokenName, 
        string memory tokenSymbol, 
        string memory baseURI,
        uint256 maxSupply,
        uint256 price,
        uint256 maxTransactionCount,
        address devAddress,
        uint256 devSaleCommission,
        bool privateMinting,
        bool creatorCanMintForFree
        ) 
        ERC721(tokenName, tokenSymbol) 
    {
        _maximumSupply = maxSupply;
        _price = price;
        _maximumTransactionCount = maxTransactionCount;
        _creatorAddress = _msgSender();
        _devAddress = devAddress;
        _devSaleCommission = devSaleCommission;
        _isPrivateMinting = privateMinting;
        _creatorCanMintForFree = creatorCanMintForFree;

        setBaseURI(baseURI, "Initial Creation");
        _initializeWhitelist();
        pause(true, "Initial Creation");
    }

    
    modifier mintingAvailable {
        if (_msgSender() != owner()) {
            require(!_isPrivateMinting || _whitelist[_msgSender()], "This is a private sale. Only creator and whitelisted addresses can mint new tokens");
        }
        require(!paused(), "Contract is paused");
        _;
    }

    modifier messageContainsMintingPrice(uint256 count){
        require((_msgSender() == _creatorAddress && _creatorCanMintForFree) || msg.value >= getPrice(count), "Message value below minting price");
        _;
    }

    modifier enoughSupply(uint256 count){
        require(totalSupply() + count <= _maximumSupply, "Requested amount exeeds maximum supply");
        _;
    }

    function mint(uint256 count) public payable mintingAvailable messageContainsMintingPrice(count) enoughSupply(count)  {
        _mint(count, _msgSender());
    }

    function mintTo(uint256 count, address recipient) public payable mintingAvailable messageContainsMintingPrice(count) enoughSupply(count) {
        _mint(count, recipient);
    }

    function setBaseURI(string memory newBaseURI, string memory reason) public onlyOwner {
        string memory oldURI = _baseTokenURI;
        _baseTokenURI = newBaseURI;
        emit BaseURIChanged(oldURI, newBaseURI, reason);
    }

    function pause(bool val, string memory reason) public onlyOwner {
        if (val) {
            _pause();
            emit TokenPaused(reason);
            return;
        }
        _unpause();
        emit TokenUnpaused(reason);
    }

    function withdrawAll() public payable onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0);
        _withdraw(_devAddress, balance * _devSaleCommission / 100);
        _withdraw(_creatorAddress, address(this).balance);
    }
    
    function totalSupply() public view override returns (uint) {
        return _tokenIdTracker.current();
    }

    function maximumSupply() public view returns (uint){
        return _maximumSupply;
    }

    function maximumTransactionCount() public view returns(uint256){
        return _maximumTransactionCount;
    }

    function creator() public view returns(address){
        return _creatorAddress;
    } 

    function developer() public view returns(address){
        return _devAddress;
    }

    function getDevSaleCommission() public view returns(uint256){
        return _devSaleCommission;
    }

    function isPrivateMinting() public view returns(bool){
        return _isPrivateMinting;
    }

    function canCreatorMintForFree() public view returns(bool){
        return _creatorCanMintForFree;
    }

    function getBaseURI() public view returns (string memory){
        return _baseURI();
    }

    function isAddressWhitelisted(address addrs) public view returns(bool){
        return _whitelist[addrs];
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function getPrice(uint256 count) public view returns (uint256) {
        return _price * count;
    }

    function tokensOwnedByAddress(address ownerAddress) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(ownerAddress);

        uint256[] memory tokensId = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            tokensId[i] = tokenOfOwnerByIndex(ownerAddress, i);
        }

        return tokensId;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function _initializeWhitelist() internal virtual {
        return;
    }

    function _mintOneToken(address recipient) internal virtual {
        uint id = totalSupply();
        _tokenIdTracker.increment();
        _safeMint(recipient, id);
        emit TokenCreated(id);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721, ERC721Enumerable, ERC721Pausable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }
    
    function _mint(uint256 _count, address recipient) private {
        require(_count <= _maximumTransactionCount, "Requested amount exeeds maximum number of tokens that can be minted within one transaction");
        
        for (uint256 i = 0; i < _count; i++) {
            _mintOneToken(recipient);
        }
    }

    function _withdraw(address _address, uint256 _amount) private {
        (bool success, ) = _address.call{value: _amount}("");
        require(success, "Transfer failed");
    }
    
}