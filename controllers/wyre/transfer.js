const { wyre } = require("./boilerplate");
const Invoice = require("../../models/invoice");
const User = require("../../models/user");
const Transaction = require("../../models/transaction");

//transfer crypto from from wyre wallet to freelancer's external wallet
const transferCrypto = async (req, res) => {
    const { currency } = req.body;
    const user = req.user;

    let result, data;
    try {
        data = await wyre.get(`/wallet/${user.wyreWallet}`);
    } catch (e) {
        return res.status(400).send(e);
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
        return res.status(404).send({ failure: "wallet address does not exist" });
    }

    const transferId = currency + "TransferId";
    if (user[transferId]) {
        try {
            const prevTransferResult = await wyre.get(
                `/transfers/${user[transferId]}`
            );
            if (
                prevTransferResult.status == "PENDING" ||
                prevTransferResult.status == "UNCONFIRMED"
            ) {
                res
                    .status(400)
                    .send({ failed: "previous transfer is being processed" });
            }
        } catch (e) {
            res.status(400).send(e);
        }
    }

    try {
        result = await wyre.post("/transfers", {
            source: "wallet:" + user.wyreWallet,
            sourceCurrency: currCode,
            sourceAmount: data.balances[currCode],
            dest: currency + ":" + user[currency],
            destCurrency: currCode,
            amountIncludesFees: true,
            autoConfirm: true,
        });
        user[transferId] = result.id;
        const newTransaction = new Transaction({
            sender: user.email,
            receiver: user.email,
            method: "WYRE",
            transferId: result.id,
            source: "wallet:" + user.wyreWallet,
            sourceCurrency: currCode,
            destination: currency + ":" + user[currency],
            destCurrency: currCode,
            amount: data.balances[currCode],
        });
        await newTransaction.save();
        await user.save();
        return res.status(200).send({ success: "funds transferred", result });
    } catch (e) {
        return res.status(400).send();
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
    transferCrypto,
    getTransfer
}
