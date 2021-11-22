const { v4: uuidv4 } = require("uuid");
const CryptoJS = require("crypto-js");
const Invoice = require("../models/invoice");
const { sendEmail } = require("./sendEmail");

const invoiceCreation = async (req, res) => {
	const { email, ETH, BTC, TRX, item, memo } = req.body;
	const clientId = uuidv4();

	const encrypedClientId = encodeURIComponent(
		CryptoJS.AES.encrypt(
			JSON.stringify({ clientId }),
			process.env.ENCRYPTION_SECRET
		)
	);

	const sum = ETH + BTC + TRX;

	if (sum === 100) {
		let total = 0;
		let savedInvoice;

		// Calculate total amount
		for (let i = 0; i < item.length; i++) {
			// console.log(item[i]);
			const pdt = item[i].qty * item[i].unitPrice;
			total = total + pdt;
		}

		console.log(total);

		// save in db
		const invoice = new Invoice({
			requestId: clientId,
			clientEmail: email,
			item: item,
			ETH: ETH,
			BTC: BTC,
			TRX: TRX,
			totalAmount: total,
			memo: memo,
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
				width: 100%;
				margin: auto;
				justify-content: center;
				align-items: center;
				/* border: 3px solid green; */
			}

			.wrapper .invoice-content-header {
				/* border: 3px solid green; */
				width: 100%;
				height: 20%;
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
				padding: 60px;
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
				/* border: 3px solid green; */
				width: 100%;
				height: 10%;
				display: flex;
				font-family: sans-serif;
				font-size: 0.8rem;
				color: #6b6a6a;
				flex-direction: column;
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

	<!-- 
        **Copy From here
    -->

	<body>
		<div class="wrapper">
			<div class="invoice-content-header">
				<img width="50%" src="https://i.postimg.cc/CKdd49nM/Whats-App-Image-2021-11-18-at-12-44-42-AM.jpg" />
			</div>
			<div class="invoice-content-body">
				<p>
					You have received an invoice from <b>Tarang Padia</b> for
					<b>${total} USD</b>
				</p>
				<p>Payment is due on <b>31st October 2021</b></p>
				<form action="https://google.com/${encrypedClientId}">
    			<input type="submit" value="View my Invoice" />
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
				<p style="margin-bottom: -10px">&copy; 2021. All rights reserved.</p>
				<p>Polaris</p>
			</div>
		</div>
	</body>
</html>

	`;

		await sendEmail({ email: email }, emailBody, "New Invoice Request");
		return res.status(200).send(savedInvoice);
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

module.exports = {
	invoiceCreation,
	getInvoiceInfo,
};
