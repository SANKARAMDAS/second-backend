const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const CryptoJS = require("crypto-js");
const User = require("../../models/user");

// Create a PaymentIntent:
const checkoutSession = async (req, res) => {
	const { email, amount } = req.body;

	User.findOne({ email: email }, async function (err, data) {
		const paymentIntent = await stripe.paymentIntents.create({
			payment_method_types: ["card"],
			amount: amount * 100,
			currency: "usd",
			transfer_data: {
				destination: data.accountId,
			},
		});
		paymentIntentObject = {
			transfer_data: paymentIntent.transfer_data,
		};

		//Checkout Session
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: [
				{
					name: "Polaris by Octaloop",
					amount: amount * 100,
					currency: "usd",
					quantity: 1,
				},
			],
			payment_intent_data: paymentIntentObject,
			mode: "payment",
			success_url: `https://www.google.com/`,
			cancel_url: `https://previews.123rf.com/images/theerakit/theerakit1810/theerakit181000029/109588163-fail-red-rubber-stamp-on-white-background-fail-stamp-sign-text-for-fail-stamp-.jpg`,
		});
		res.send(session.url);
	});
};

module.exports = {
	checkoutSession,
};

//DirectTransfer
