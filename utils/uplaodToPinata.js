const pinataSdk = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataSecretkey = process.env.PINATA_SECRET_KEY;
const pinata = pinataSdk(pinataApiKey, pinataSecretkey);

async function storeImages(imagesFilePath) {
	const fullImagesPath = path.resolve(imagesFilePath); // this will resolve the whole files path for us
	const files = fs.readdirSync(fullImagesPath);
	// console.log(files);
	let responses = [];
	console.log("uploading to ipfs");
	for (fileIndex in files) {
		const readableStreamForFile = fs.createReadStream(
			`${fullImagesPath}/${files[fileIndex]}`
		); // this func reades the byte data in images to uplaod it rather than just pushing
		try {
			const response = await pinata.pinFileToIPFS(readableStreamForFile);
			responses.push(response);
		} catch (error) {
			console.log(error);
		}
	}
	return { responses, files };
}

async function storeTokenUriMetadata(metadata) {
	try {
		const response = await pinata.pinJSONToIPFS(metadata);
		return response;
	} catch (error) {
		console.log(error);
		return null;
	}
}

module.exports = { storeImages, storeTokenUriMetadata };
