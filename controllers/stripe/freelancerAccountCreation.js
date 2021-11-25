const stripe = require("stripe")(
	"sk_test_51JyqyfSIe3yqgvjaEvaxLEJmC13EpJUHzKnhmF26FFwItuSmvnhB7xq8g5F9SaclEjMhHC4XhD7rftd03fqjgqSa007jP76HFG"
);

const createAccount = async (req, res) => {
	const account = await stripe.accounts.create({
		type: "express",
		country: "US",
		email: "jenny.rosen@example.com",
		capabilities: {
			card_payments: { requested: true },
			transfers: { requested: true },
		},
	});

	const accounts = await stripe.accounts.create({ type: "express" });

	res.send(accounts);
};
module.exports = { createAccount };
