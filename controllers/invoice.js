const { v4: uuidv4 } = require("uuid");
const CryptoJS = require("crypto-js");
const Invoice = require("../models/invoice");
const { sendEmail } = require("./sendEmail");

const invoiceCreation = async (req, res) => {
	const {
		clientEmail,
		freelancerEmail,
		clientName,
		freelancerName,
		ETH,
		BTC,
		FIAT,
		item,
		memo,
		creationDate,
		dueDate,
	} = req.body;

	const invoiceId = uuidv4();

	const encrypedClientId = encodeURIComponent(
		CryptoJS.AES.encrypt(
			JSON.stringify({ invoiceId }),
			process.env.ENCRYPTION_SECRET
		).toString()
	);

	const sum = ETH + BTC + FIAT;
	const link = `http://localhost:3000/pay-invoice/${encrypedClientId}`;

	if (sum === 100) {
		let total = 0;
		let savedInvoice;

		// Calculate total amount
		for (let i = 0; i < item.length; i++) {
			// console.log(item[i]);
			const pdt = parseInt(item[i].quantity) * parseInt(item[i].price);
			total = total + pdt;
		}

		console.log(total);

		// save in db
		const invoice = new Invoice({
			invoiceId: invoiceId,
			freelancerEmail: freelancerEmail,
			clientEmail: clientEmail,
			item: item,
			ETH: ETH,
			BTC: BTC,
			FIAT: FIAT,
			totalAmount: total,
			memo: memo,
			creationDate: creationDate,
			dueDate: dueDate,
			link: link,
		});

		try {
			savedInvoice = await invoice.save();
		} catch (err) {
			console.log(err);
			return res.status(400).send(err);
		}

		//send email
		const emailBody = `
		<html lang="en">
		<head>
			<style>
			body {
				background-color: #f2f4f6;
			}

			.wrapper {
				height: 100%;
				width: 50%;
				margin: auto;
				justify-content: center;
				align-items: center;
			}

			.wrapper .invoice-content-header {
				width: 100%;
				height: 40%;
				display: flex;
				justify-content: center;
				align-items: center;
			}

			.wrapper .invoice-content-header .logo {
				margin-bottom: -60px;
			}

			.wrapper .invoice-content-body {
				/* border: 3px solid green; */
				background-color: #fff;
				width: 100%;
				height: 55%;
				padding: 0px;
				padding-top: 40px;
				box-sizing: border-box;
				/* display: flex; */
				justify-content: start;
			}

			.wrapper .invoice-content-body button {
				width: 50%;
				height: 40px;
				cursor: pointer;
				background-color: #3869d4;
				border: none;
				color: #fff;
				font-weight: 700;
				border-radius: 5px;
				margin-top: 10px;
				margin-bottom: 15px;
			}

			.wrapper .invoice-content-body button:active {
				background-color: #304c8a;
			}

			.wrapper .invoice-content-body p {
				font-size: 0.9rem;
				font-family: sans-serif;
			}

			.wrapper .invoice-content-body hr {
				border: none;
				height: 0.1px;
				background: rgb(216, 214, 214);
			}

			.wrapper .invoice-content-body .body-footer {
				margin-top: 20px;
				font-size: 0.8rem;
			}

			.wrapper .invoice-content-footer {
				width: 100%;
				height: 10%;
				font-family: sans-serif;
				font-size: 0.8rem;
				color: #6b6a6a;
				display: flex;
				justify-content: center;
				align-items: center;
			}

			.submit-button{
				background-color: #3246a8;
				color: #ffffff;
				border: none;
				padding: 8px;
				text-decoration: none;
				font-size: 16px;
				border-radius: 8px;
			}

			.center {
				display: flex;
				justify-content: center;
				align-items: center;
			  }

			@media screen and (max-width: 992px) {
				.wrapper {
					width: 55%;
				}

				.wrapper .invoice-content-header .logo {
					margin-bottom: -80px;
				}
			}

			@media screen and (max-width: 786px) {
				.wrapper {
					width: 70%;
				}

				.wrapper .invoice-content-body {
					height: 60%;
				}
			}

			@media screen and (max-width: 486px) {
				.wrapper {
					width: 70%;
				}

				.wrapper .invoice-content-body {
					padding-top: 10px;
					height: 100%;
				}

				.wrapper .invoice-content-body button {
					width: 70%;
					background-color: #3869d4;
					font-weight: 700;
				}

				.wrapper .invoice-content-header .logo {
					margin-bottom: -10px;
				}
			}

			@media screen and (max-width: 320px) {
				.wrapper {
					width: 100%;
				}
			}
		</style>
	</head>

	<body>
		<div class="wrapper">
			<div class="invoice-content-header">
				<img width="100%" src="https://i.postimg.cc/CKdd49nM/Whats-App-Image-2021-11-18-at-12-44-42-AM.jpg" />
			</div>
			<div class="invoice-content-body">
				<p>
					Hey ${clientName}!
					<br/>
					You have received an invoice from <b>${freelancerName}</b> generated on ${creationDate} for
					<b>${total} USD</b>
				</p>
				<p>Payment is due on <b>${dueDate}</b></p>
				<form action="http://localhost:3000/pay-invoice/${encrypedClientId}">
    			<input type="submit" value="View my Invoice" class="submit-button center"/>
				</form>
				<p style="margin-bottom: 20px">
					Cheers, <br />
					The Polaris Team
				</p>
				<hr />
				<p class="body-footer">
					Want to get paid in crypto? <a href="#">Sign up</a> for free
				</p>
				<p class="body-footer">
					If you have any questions about the invoice, simply reply to this
					email or reach out to our <a href="#">support team</a> for help.
				</p>
			</div>
			<div class="invoice-content-footer">
				&copy; 2021. All rights reserved.
				<br/>
				Polaris
			</div>
		</div>
		</body>
</html>

	`;

		//await sendEmail({ email: clientEmail }, emailBody, "New Invoice Request");
		return res.status(200).send(encrypedClientId);
	} else {
		res.send("Proportions should add up to 100");
	}
};

const getInvoiceInfo = async (req, res) => {
	const { requestId } = req.body;

	const InvoiceInfo = await Invoice.findOne({ requestId });
	if (InvoiceInfo) {
		return res.status(200).send(InvoiceInfo);
	} else {
		return res.status(400).send("Invalid Request");
	}
};

const getFreelancerInvoices = async (req, res) => {
	const { freelancerEmail } = req.body;

	const InvoiceInfo = await Invoice.findOne({ freelancerEmail });
	if (InvoiceInfo) {
		return res.status(200).send(InvoiceInfo);
	} else {
		return res.status(400).send("Invalid Request");
	}
};

module.exports = {
	invoiceCreation,
	getInvoiceInfo,
	getFreelancerInvoices,
};
