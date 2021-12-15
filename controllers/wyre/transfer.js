const { wyre } = require("./boilerplate")
const Invoice = require("../../models/invoice")
const User = require("../../models/user")

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
        return res.status(200).send({ success: "funds transferred", result })
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



    let exchangeResult, user

    try {
        exchangeResult = await wyre.get('/rates?as=multiplier')
        user = await User.findOne({ email: invoiceInfo.freelancerEmail })
    } catch (e) {
        return res.status(400).send()
    }

    if (!user.wyreWallet) {
        return res.status(400).send()
    }

    var finalResult = []


    for (var i = 0; i < invoiceInfo.proportions.length; i++) {
        if (invoiceInfo.proportions[i].currency == "FIAT") continue;
        const currency = invoiceInfo.proportions[i].currency

        if (invoiceInfo.proportions[i].transferId) {
            let transferResult
            try {
                transferResult = await wyre.get(`/transfers/${invoiceInfo.proportions[i].transferId}`)
                switch (transferResult.status) {
                    case "PENDING":
                        finalResult.push({ currency: "pending" })
                        break
                    case "COMPLETED":
                        finalResult.push({ currency: "transfer completed" })
                        break
                }
            } catch (e) {
                return res.status(400).send()
            }
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

        let result
        const amount = (invoiceInfo.proportions[i].percentage / 100) * invoiceInfo.totalAmount
        const sourceAmount = amount * exchangeResult["USDC" + currCode]

        try {
            result = await wyre.post('/transfers', {
                //source - wyre master wallet
                source: 'wallet:WA_XXXXXXXXX',
                sourceCurrency: "USDC",
                sourceAmount,
                dest: user.wyreWallet,
                destCurrency: currCode,
                autoConfirm: true
            })
            invoiceInfo.proportions[i].transferId = result.id
            finalResult.push({ currency: result.id })
        } catch (e) {
            return res.status(400).send()
        }


    }


}

//get transfer info using transferId
const getTransfer = async (req, res) => {
    const transferId = ""
    let result
    try {
        result = await wyre.get(`/transfers/${transferId}`)
        res.status(200).send(result)
    } catch (e) {
        res.status(400).send(e)
    }
}


module.exports = {
    transferCrypto
}