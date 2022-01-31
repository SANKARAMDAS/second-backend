const { wyre } = require("./boilerplate")
const Transaction = require("../../models/transaction")
const Invoice = require("../../models/invoice")

//get user's transaction history
const getTransactionHistory = async (req, res) => {

    const user = req.user
    let result
    try {
        result = await Transaction.find({ $or: [{ sender: user.email }, { receiver: user.email }] })
        for (var i = 0; i < result.length; i++) {
            if (result[i].status == "EXPIRED" || result[i].status == "FAILED" || result[i].status == "COMPLETED") {
                continue
            }
            const transferResult = await wyre.get(`/transfers/${result[i].transferId}`)
            result[i].status = transferResult.status
            await Freelancer.findOneAndUpdate(
                { transferId: result[i].transferId },
                { status: transferResult.status }
            );
        }
        res.status(200).send(result)
    } catch (e) {
        res.status(400).send(e)
    }
}

//transfer crypto between wyre wallets
const wyreTransfer = async (invoiceId) => {

    const invoiceInfo = await Invoice.findOne({ invoiceId });

    let exchangeResult, user

    try {
        exchangeResult = await wyre.get('/rates?as=multiplier')
        user = await User.findOne({ email: invoiceInfo.freelancerEmail })
    } catch (e) {
        throw new Error(e)
    }

    if (!user.wyreWallet) {
        throw new Error({ message: "wyre wallet does not exist." })
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
                        continue
                    case "COMPLETED":
                        finalResult.push({ currency: "transfer completed" })
                        continue
                    case "UNCONFIRMED":
                        finalResult.push({ currency: "transfer being processed" })
                        continue
                }
            } catch (e) {
                throw new Error()
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
        const sourceAmount = amount * exchangeResult["USD" + currCode]

        try {
            result = await wyre.post('/transfers', {
                //source - wyre master account
                source: 'account:' + process.env.WYRE_ACCOUNT_ID,
                sourceCurrency: "USD",
                sourceAmount,
                dest: user.wyreWallet,
                destCurrency: currCode,
                autoConfirm: true
            })
            invoiceInfo.proportions[i].transferId = result.id
            await invoiceInfo.save()
            return invoiceInfo
        } catch (e) {
            throw new Error(e)
        }

    }

}

//wire payouts
const wirePayout = async (invoiceId) => {

    try {
        const invoiceInfo = await Invoice.findOne({ invoiceId });

        for (var i = 0; i < invoiceInfo.proportions.length; i++) {
            if (invoiceInfo.proportions[i].currency != "FIAT") continue;

            if (invoiceInfo.proportions[i].transferId) {
                const transferResult = await wyre.get(`/transfers/${invoiceInfo.proportions[i].transferId}`)
                if (transferResult.status == 'COMPLETE' || transferResult.status == 'PENDING' || transferResult.status == 'UNCONFIRMED') throw new Error({ message: transferResult.status })
            }

            let result
            const sourceAmount = (invoiceInfo.proportions[i].percentage / 100) * invoiceInfo.totalAmount
            result = await wyre.post('/transfers', {
                //source - wyre master account
                source: 'account:' + process.env.WYRE_ACCOUNT_ID,
                sourceCurrency: 'USD',
                sourceAmount,
                dest: invoiceInfo.paymentMethod,
                destCurrency: 'INR',
                autoConfirm: true
            })
            invoiceInfo.proportions[i].transferId = result.id
            await invoiceInfo.save()
            return invoiceInfo
        }

    } catch (e) {
        throw new Error(e)
    }

}

//webhook endpoint
const getTransaction = async (req, res) => {
    const { id, status } = req.body

    try {
        const transaction = await Transaction.findOne({ transferId: id })
        transaction.status = status
        await transaction.save()

        if (transaction.method == "CARD" || transaction.method == "ACH" || transaction.method == "WYRE PAYMENT" && status == "COMPLETED") {
            await wyreTransfer(transaction.invoiceId)
            await wirePayout(transaction.invoiceId)
        }
        res.status(200).send()
    } catch (e) {
        res.status(400).send(e)
    }
}

module.exports = {
    getTransactionHistory,
    getTransaction
}