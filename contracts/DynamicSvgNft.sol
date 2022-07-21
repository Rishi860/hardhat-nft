// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";

contract DynamicSvgNft is ERC721 {
	uint256 private s_tokenCounter;
	string private i_lowImageUri;
	string private i_highImageUri;
	string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";
	AggregatorV3Interface internal immutable i_priceFeed;
	mapping(uint256 => int256) public s_tokenIdToHighValue;

	event CreatedNFT(uint256 indexed tokenId, int256 highValue);

	constructor(
		address priceFeedAddress,
		string memory lowSvg,
		string memory highSvg
	) ERC721("Dynamic SVG NFT", "DSN") {
		s_tokenCounter = 0;
		i_lowImageUri = svgToImageUri(lowSvg);
		i_highImageUri = svgToImageUri(highSvg);
		i_priceFeed = AggregatorV3Interface(priceFeedAddress); // this is used to set whether to send high or low svg
	}

	function svgToImageUri(string memory svg)
		public
		pure
		returns (string memory)
	{
		string memory svgBase64Encoded = Base64.encode(
			bytes(string(abi.encodePacked(svg)))
		); // encodePacked converts into binary but in a packed way not wasting much binary digits: avoiding extra start zeroes
		return string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded)); // abi.encodePacked: gives the byte code which we convert into string using string()
	}

	function mintNft(int256 highValue) public {
		s_tokenIdToHighValue[s_tokenCounter] = highValue;
		s_tokenCounter = s_tokenCounter + 1;
		_safeMint(msg.sender, s_tokenCounter);
    emit CreatedNFT(s_tokenCounter, highValue);
	}

	function _baseURI() internal pure override returns (string memory) {
		return "data:application/json;base64,";
	}

	function tokenURI(uint256 tokenId)
		public
		view
    virtual
		override
		returns (string memory)
	{
		// this should be if and reverted with an error
		// string memory imageUri = "hi";
		require(_exists(tokenId), "URI Query for non-existent token");

		(, int256 price, , , ) = i_priceFeed.latestRoundData();
		string memory imageUri = i_lowImageUri;
		if (price >= s_tokenIdToHighValue[tokenId]) {
			imageUri = i_highImageUri;
		}

		string(
			abi.encodePacked(
				_baseURI(),
				Base64.encode(
					bytes(
						abi.encodePacked(
							'{"name":"',
							name(),
							'","description": "An nft that changes based on the chainlink feed",',
							'"attributes":"[{"trait_type":"coolness", "value": 100}]", "image":"',
							imageUri,
							'"}'
						)
					)
				)
			)
		);
	}
}
