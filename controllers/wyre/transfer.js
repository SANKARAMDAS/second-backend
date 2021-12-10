const { wyre } = require("./boilerplate")
const Invoice = require("../../models/invoice")

//transfer crypto from from wyre wallet to freelancer's external wallet
const transferCrypto = async (req, res) => {
    const { currency } = req.body
    const user = req.user

    let result, data
    try {
        data = await wyre.get(`/wallet/${user.wyreWallet}`)
    } catch (e) {
        return res.status(400).send(e)
    }

    let currCode

    switch (currency) {
        case "bitcoin":
            currCode = "BTC"
            break
        case "ethereum":
            currCode = "ETH"
            break
    }

    if (!user[currency]) {
        // ask user to add external wallet address in profile
        return res.status(404).send({ failure: "wallet address does not exist" })
    }

    try {
        result = await wyre.post('/transfers', {
            source: "wallet:" + user.wyreWallet,
            sourceCurrency: currCode,
            sourceAmount: data.balances[currCode],
            dest: currency + ":" + user[currency],
            destCurrency: currCode,
            amountIncludesFees: true,
            autoConfirm: true
        })
        return res.status(200).send({ success: "funds transferred" })
    } catch (e) {
        return res.status(400).send()
    }

}

//transfer crypto between wyre wallets
const wyreTransfer = async (req, res) => {

    const { invoiceId } = req.body;

    const invoiceInfo = await Invoice.findOne({ invoiceId });
    if (!invoiceInfo) {
        return res.status(404).send();
    }



}


module.exports = {
    transferCrypto
}