const { wyre } = require("./boilerplate")
const Transaction = require("../../models/transaction")
const Invoice = require("../../models/invoice")
const Freelancer = require("../../models/freelancer")

//get user's transaction history
const getTransactionHistory = async (req, res) => {

    const { startTime, endTime } = req.body
    if (!startTime) startTime = 0;
    const date = new Date()
    if (!endTime) endTime = date.getTime()
    const user = req.user
    let result;
    var finResult = []
    try {
        result = await Transaction.find({ $or: [{ sender: user.email }, { receiver: user.email }] })
        for (var i = 0; i < result.length; i++) {
            if (result[i].createdAt >= startTime && result[i].createdAt <= endTime) {
                finResult.push(result[i]);
            }
        }
        res.status(200).send(finResult)
    } catch (e) {
        res.status(400).send(e)
    }
}

//transfer crypto between wyre wallets
const wyreTransfer = async (invoiceId) => {

    try {

        const invoiceInfo = await Invoice.findOne({ invoiceId });

        if (!invoiceInfo) {
            return new Error("invalid invoice id.")
        }

        const exchangeResult = await wyre.get('/v3/rates?as=multiplier')

        const user = await Freelancer.findOne({ email: invoiceInfo.freelancerEmail })

        if (!user.wyreWallet) {
            return new Error({ message: "wyre wallet does not exist." })
        }

        var finalResult = {}

        for (var i = 0; i < invoiceInfo.proportions.length; i++) {


            if (invoiceInfo.proportions[i].currency == "FIAT" || invoiceInfo.proportions[i].percentage == 0) continue;
            const currency = invoiceInfo.proportions[i].currency

            if (invoiceInfo.proportions[i].transferId) {
                let transferResult

                transferResult = await wyre.get(`/v3/transfers/${invoiceInfo.proportions[i].transferId}`)
                switch (transferResult.status) {
                    case "PENDING":
                        finalResult[currency] = "transfer pending"
                        continue
                    case "COMPLETED":
                        finalResult[currency] = "transfer completed"
                        continue
                    case "UNCONFIRMED":
                        finalResult[currency] = "transfer being processed"
                        continue
                }

            }

            const amount = (invoiceInfo.proportions[i].percentage / 100) * invoiceInfo.totalAmount
            const sourceAmount = amount * exchangeResult["USDC" + currency]

            const result = await wyre.post('/v3/transfers', {
                //source - wyre master account
                source: 'account:' + process.env.WYRE_ACCOUNT_ID,
                sourceCurrency: "USDC",
                sourceAmount,
                dest: 'wallet:' + user.wyreWallet,
                destCurrency: currency,
                autoConfirm: true
            })

            invoiceInfo.proportions[i].transferId = result.id

        }

        await invoiceInfo.save()
        return finalResult

    } catch (e) {
        console.log(e)
        return new Error(e.message)
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
    const { id, status, invoiceId } = req.body
    var trustedIps = ['x.x.x.x'];
    var requestIP = req.connection.remoteAddress;
    try {
        // if (trustedIps.indexOf(requestIP) < 0) throw new Error("Invalid IP aaddress")
        // const transaction = await Transaction.findOne({ transferId: id })
        // transaction.status = status
        // await transaction.save()

        // if ((transaction.method == "CARD" || transaction.method == "ACH" || transaction.method == "WYRE PAYMENT") && status == "COMPLETED") {
        // await wyreTransfer(transaction.invoiceId)
        // await wirePayout(transaction.invoiceId)
        // }
        const result = await wyreTransfer(invoiceId)
        res.status(200).send({ result })
    } catch (e) {
        res.status(400).send(e)
    }

}

//card transaction webhook
const getWalletOrderStatus = async (req, res) => {
    const { orderId, orderStatus, transferId } = req.body
    try {
        const invoiceInfo = await Invoice.findOne({ walletOrderId: orderId })

        await wyreTransfer(invoiceInfo.invoiceId)

        res.status(200).send();
    } catch (e) {
        console.log(e)
        res.status(400).send(e);
    }
}

const enableorder = async (req, res) => {
    const { owner, webhook } = req.body

    try {
        const result = await wyre.post('/v2/digitalwallet/webhook', {
            owner, webhook
        })
        res.send(result)
    } catch (e) {
        res.status(400).send(e)
    }

}

module.exports = {
    getTransactionHistory,
    getTransaction,
    getWalletOrderStatus,
    enableorder
}