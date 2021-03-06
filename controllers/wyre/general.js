const { wyre } = require("./boilerplate");

//get wallet info - name, balance, type
const getWallet = async (req, res) => {
	const user = req.user;
	let result;
	try {
		result = await wyre.get(`/wallet/${user.wyreWallet}`);
		res.status(200).send(result);
	} catch (e) {
		res.status(400).send(e);
	}
};

//in case there's an error creating a wallet when user signs up
const createWallet = async (req, res) => {
	const user = req.user;
	if (!user.wyreWallet) {
		res.status(400).send("wallet already exisits");
	}

	try {
		result = await wyre.post("/wallets", {
			type: "DEFAULT",
			name: user._id,
		});
		user.wyreWallet = result.id;
		await user.save();
		res.status(200).send();
	} catch (e) {
		console.log(e);
		res.status(400).send();
	}
};

//get wallet info - name, balance, type
const getFreelancerBalance = async (req, res) => {
	const { user } = req.user;
	let account;
	try {
		account = await wyre.get(`/wallet/${user.wyreWallet}`);
		res.status(200).send({ msg: "Success", data: account });
	} catch (e) {
		res.status(400).send(e);
	}
};


module.exports = {
	getWallet,
	createWallet,
	getFreelancerBalance,
};
