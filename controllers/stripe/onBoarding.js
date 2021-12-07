const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../../models/user");

//Create Account
const accountCreation = async (email) => {
	const account = await stripe.accounts.create({
		type: "custom",
		country: "US",
		email: email,
		capabilities: {
			card_payments: { requested: true },
			transfers: { requested: true },
		},
	});
	console.log("Account: ", account.id);
	return { accountId: account.id };
};

const onBoarding = async (req, res) => {
	const { email } = req.body;

	User.findOne({ email: email }, async (err, data) => {
		if (!data) {
			res.send("Not registered");
		} else {
			// console.log(data);
			const accountLink = await stripe.accountLinks.create({
				account: data.stripeAccountId,
				return_url: `https://www.google.com/`, // on Onboarding failre
				refresh_url: `https://previews.123rf.com/images/theerakit/theerakit1810/theerakit181000029/109588163-fail-red-rubber-stamp-on-white-background-fail-stamp-sign-text-for-fail-stamp-.jpg`, // On successful Onboarding
				type: "account_onboarding",
			});
			res.send(accountLink.url);
		}
	});
};

const chargesEnabled = async (req, res) => {
	console.log(req.body);
	const { email } = req.body;
	console.log(email);

	User.findOne({ email: email }, async function (err, data) {
		console.log(data);
		if (!data) {
			res.send("Not registered");
		} else {
			const chargeEnabled = await stripe.accounts.retrieve(
				data.stripeAccountId
			);
			console.log(chargesEnabled);
			res.send(chargeEnabled.charges_enabled);
		}
	});
};

module.exports = {
	accountCreation,
	onBoarding,
	chargesEnabled,
};
