//SPDX-License-Identifier: MIT
//Contract based on [https://docs.openzeppelin.com/contracts/3.x/erc721](https://docs.openzeppelin.com/contracts/3.x/erc721)

/**
██████╗  █████╗ ██╗███╗   ██╗████████╗ █████╗ ███████╗   ██╗  ██╗██╗   ██╗███████╗
██╔══██╗██╔══██╗██║████╗  ██║╚══██╔══╝██╔══██╗██╔════╝   ╚██╗██╔╝╚██╗ ██╔╝╚══███╔╝
██████╔╝███████║██║██╔██╗ ██║   ██║   ╚██████║███████╗    ╚███╔╝  ╚████╔╝   ███╔╝ 
██╔═══╝ ██╔══██║██║██║╚██╗██║   ██║    ╚═══██║╚════██║    ██╔██╗   ╚██╔╝   ███╔╝  
██║     ██║  ██║██║██║ ╚████║   ██║    █████╔╝███████║██╗██╔╝ ██╗   ██║   ███████╗
╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝    ╚════╝ ╚══════╝╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝
 */

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./ContextMixin.sol";

contract Paint95 is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    IERC2981,
    Ownable,
    ReentrancyGuard,
    ContextMixin
{
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private tokenCounter;

    string public verificationHash;
    bool private isOpenSeaProxyActive = true;

    // ============ ACCESS CONTROL/SANITY MODIFIERS ============

    constructor() ERC721("Paint95Test", "Painting") {}

    // ============ PUBLIC FUNCTIONS FOR MINTING ============

    function mint(address owner_, string memory metadataURI)
        external
        nonReentrant
        onlyOwner
        returns (uint256)
    {
        uint256 id = nextTokenId();
        _safeMint(owner(), id);
        _setTokenURI(id, metadataURI);
        _transfer(owner(), owner_, id);
        return id;
    }

    // ============ PUBLIC READ-ONLY FUNCTIONS ============

    function getLastTokenId() external view returns (uint256) {
        return tokenCounter.current();
    }

    // ============ OWNER-ONLY ADMIN FUNCTIONS ============

    // function to disable gasless listings for security in case
    // opensea ever shuts down or is compromised
    function setIsOpenSeaProxyActive(bool _isOpenSeaProxyActive)
        external
        onlyOwner
    {
        isOpenSeaProxyActive = _isOpenSeaProxyActive;
    }

    function setVerificationHash(string memory _verificationHash)
        external
        onlyOwner
    {
        verificationHash = _verificationHash;
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    function withdrawTokens(IERC20 token) public onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        token.transfer(msg.sender, balance);
    }

    // ============ SUPPORTING FUNCTIONS ============

    function nextTokenId() private returns (uint256) {
        tokenCounter.increment();
        return tokenCounter.current();
    }

    // ============ FUNCTION OVERRIDES ============

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        ERC721Enumerable._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        ERC721URIStorage._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, IERC165, ERC721Enumerable)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            ERC721Enumerable.supportsInterface(interfaceId);
    }

    /**
     * Override isApprovedForAll to auto-approve OS's proxy address
     */
    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool isOperator)
    {
        // if OpenSea's ERC721 Proxy Address is detected, auto-return true
        if (
            isOpenSeaProxyActive &&
            operator == address(0x58807baD0B376efc12F5AD86aAc70E78ed67deaE)
        ) {
            return true;
        }

        // otherwise, use the default ERC721.isApprovedForAll()
        return ERC721.isApprovedForAll(owner, operator);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return ERC721URIStorage.tokenURI(tokenId);
    }

    /**
     * @dev See {IERC165-royaltyInfo}.
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        require(_exists(tokenId), "Nonexistent token");

        /**
         * there had been plans to support one royalty address per NFT,
         * creating a new wallet with each piece that gets paid out
         * weekly. Sadly, IERC165 isn't fully supported yet, and on
         * OpenSea you still have only one address to specify. Thus the
         * architecture was changed. For a previous version of this
         * contract. see:
         * https://mumbai.polygonscan.com/address/0x079a01cE8Ac2025dBc73b7D1bEB7F2Be54a0107b#code
         */

        return (owner(), SafeMath.div(SafeMath.mul(salePrice, 10), 100));
    }

    /**
     * This is used instead of msg.sender as transactions won't be sent by the original token owner, but by OpenSea.
     */
    function _msgSender() internal view override returns (address sender) {
        return ContextMixin.msgSender();
    }
}
