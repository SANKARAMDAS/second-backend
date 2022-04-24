const { wyre } = require("./boilerplate");
const Invoice = require("../../models/invoice");
const Freelancer = require("../../models/freelancer");
const Transaction = require("../../models/transaction");
const bcrypt = require("bcrypt")
const { sendEmail } = require("../sendEmail");
const jwt = require("jsonwebtoken")
const speakeasy = require("speakeasy")
const QRCode = require("qrcode")

const transferInitiate = async (req, res) => {
    const { token, currency } = req.body
    // const user = req.user
    try {
        const user = await Freelancer.findById("6263cdb9a81fd59d5447da2f")

        if (!user || !user.is2faenabledPayout) {
            return res.status(400).send({ message: "Enable Payout 2FA in profile" })
        }
        if (user.kycStatus !== 'Active') {
            return res.status(400).send({ message: "KYC status: " + user.kycStatus })
        }

        const secret = user.tempSecretPayout;
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token
        });

        if (verified) {

            var digits = '0123456789';
            let otp = '';
            for (let i = 0; i < 4; i++) {
                otp += digits[Math.floor(Math.random() * 10)];
            }

            const emailBody = `
	<div>
		<p style="font-weight: bold;" >Hello ${user.name},</p>
		<p>${otp} is the Onetime password for your Binamite wallet transaction. Do not share OTP for security reasons.</p>
		<p>Have a Nice Day!</p>            
	</div>
	`;

            const jwtoken = jwt.sign({
                otp, currency
            }, process.env.JWT_VERIFY, { expiresIn: 60 * 60 });

            user.payoutOTP = jwtoken
            await user.save()
            await sendEmail({ email: user.email, name: user.name }, emailBody, "Transaction 2FA");

            return res.status(200).send({ message: "OTP sent on registered email address." })
        } else {
            return res.status(400).send({ message: "invalid token" })
        }

    } catch (e) {
        return res.status(400).send({ message: e.message });
    }
}

//transfer crypto from from wyre wallet to freelancer's external wallet
const transferCrypto = async (req, res) => {
    const { otp } = req.body;
    // const user = req.user;

    try {

        const user = await Freelancer.findById("6263cdb9a81fd59d5447da2f")

        if (!user || !user.payoutOTP) {
            return res.status(400).send()
        }

        const decoded = jwt.verify(jwtoken, process.env.JWT_VERIFY);

        if (decoded.otp !== otp) {
            return res.status(400).send({ message: "invalid OTP." })
        }

        const currency = decoded.currency

        if (user.kycStatus !== 'Active') {
            return res.status(400).send({ message: "KYC status: " + user.kycStatus })
        }

        if (!user.is2faenabledPayout) {
            return res.status(400).send({ message: "Enable Payout 2FA in profile" })
        }

        // if (!securityPin) return res.status(400).send({ message: "Enter Security pin." })
        // if (!user.securityPin) return res.status(404).send({ message: "Set up new security pin in profile" })

        // const isValid = await bcrypt.compare(securityPin, user.securityPin)

        // if (!isValid) res.status(400).send({ message: "Incorrect security pin." })



        const data = await wyre.get(`/v2/wallet/${user.wyreWallet}`);

        if (!data.availableBalances[currCode]) {
            return res.status(400).send({ message: "0 Balance" })
        }

        let currCode;

        switch (currency) {
            case "bitcoin":
                currCode = "BTC";
                break;
            case "ethereum":
                currCode = "ETH";
                break;
            case "usdc":
                currCode = "USDC";
                break;
        }

        if (!user[currency]) {
            // ask user to add external wallet address in profile
            return res.status(404).send({ message: "wallet address does not exist" });
        }

        const transferId = currency + "TransferId";
        if (user[transferId]) {
            const prevTransferResult = await wyre.get(
                `/v3/transfers/${user[transferId]}`
            );
            if (
                prevTransferResult.status == "PENDING" ||
                prevTransferResult.status == "UNCONFIRMED"
            ) {
                res
                    .status(400)
                    .send({ failed: "previous transfer is being processed" });
            }
        }



        console.log(data.availableBalances[currCode])

        const result = await wyre.post("/v3/transfers", {
            source: "wallet:" + user.wyreWallet,
            sourceCurrency: currCode,
            sourceAmount: data.availableBalances[currCode],
            dest: currency + ":" + user[currency],
            destinationCurrency: currCode,
            amountIncludesFees: true,
            autoConfirm: true,
        });

        console.log(result)

        user[transferId] = result.id;
        user.payoutOTP = ""
        const newTransaction = new Transaction({
            sender: user.email,
            receiver: user.email,
            method: "WYRE",
            transferId: result.id,
            source: "wallet:" + user.wyreWallet,
            sourceCurrency: currCode,
            destination: currency + ":" + user[currency],
            destCurrency: currCode,
            amount: data.availableBalances[currCode],
        });
        await newTransaction.save();
        await user.save();
        return res.status(200).send({ message: "funds transferred", result });
    } catch (e) {
        return res.status(400).send({ message: e.message });
    }
};

//get transfer info using transferId
const getTransfer = async (req, res) => {
    const transferId = "";
    let result;
    try {
        result = await wyre.get(`/transfers/${transferId}`);
        res.status(200).send(result);
    } catch (e) {
        res.status(400).send(e);
    }
};

module.exports = {
    transferInitiate,
    transferCrypto,
    getTransfer
}
