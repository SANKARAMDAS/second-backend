const invoiceCreation = async (req, res) => {
	const { email, ETH, BTC, TRX, totalAmount } = req.body;

	const sum = ETH + BTC + TRX;

	if (sum === 100) {
		// save in db
		//send email
	} else {
		res.send("Proportions should add up to 100");
	}
};

module.exports = {
	invoiceCreation,
};
