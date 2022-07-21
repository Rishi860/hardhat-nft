// We are going to skimp a bit on these tests...

const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const {
	developmentChains,
	networkConfig,
} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
	? describe.skip
	: describe("Random IPFS NFT Unit Tests", async function () {
			let randomIpfsNft, deployer, vrfCoordinatorV2Mock;

			beforeEach(async () => {
				accounts = await ethers.getSigners();
				deployer = accounts[0];
				await deployments.fixture(["mocks", "randomipfs"]);
				randomIpfsNft = await ethers.getContract("RandomIpfsNft");
				vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
			});

			describe("constructor", () => {
				it("sets starting values correctlyy", async function () {
					const dogTokenUriZero = await randomIpfsNft.getDogTokenUris(0);
					const isInitialized = await randomIpfsNft.getInitialized();
					assert(dogTokenUriZero.includes("ipfs://"));
					assert.equal(isInitialized, true);
				});
			});

			describe("requestNft", () => {
				it("fails if payment isn't sent with the request", async function () {
					await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
						"NeedMoreETHSent"
					);
				});
				it("emits an event and kicks off a random word request", async function () {
					const fee = await randomIpfsNft.getMintFee();
					await expect(
						randomIpfsNft.requestNft({ value: fee.toString() })
					).to.emit(randomIpfsNft, "NftRequested");
				});
			});
			describe("fulfillRandomWords", () => {
				it("mints NFT after random number is returned", async function () {
					await new Promise(async (resolve, reject) => {
						// setTimeout(resolve, 60000);
						randomIpfsNft.once("NftMinted", async () => {
							try {
								console.log("yeah we got it---------------------");
								const tokenUri = await randomIpfsNft.tokenURI("0");
								const tokenCounter = await randomIpfsNft.getTokenCounter();
								assert.equal(tokenUri.toString().includes("ipfs://"), true);
								assert.equal(tokenCounter.toString(), "1");
								resolve();
							} catch (e) {
								console.log(e);
								reject(e);
							}
						});
						try {
							const fee = await randomIpfsNft.getMintFee();
							console.log(fee.toString());
							const requestNftResponse = await randomIpfsNft.requestNft({
								value: fee.toString(),
							});
							const requestNftReceipt = await requestNftResponse.wait(1);
							console.log(requestNftReceipt.events[1].args.requestId.toString());
							console.log(randomIpfsNft.address);
							await vrfCoordinatorV2Mock.fulfillRandomWords(
								requestNftReceipt.events[1].args.requestId.toString(),
								randomIpfsNft.address
							);
						} catch (e) {
							console.log(e);
							reject(e);
						}
					});
				});
			});
	  });
