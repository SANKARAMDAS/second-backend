const { wyre } = require("./boilerplate")
const Transaction = require("../../models/transaction")
const Invoice = require("../../models/invoice")

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
    var trustedIps = ['x.x.x.x'];
    var requestIP = req.connection.remoteAddress;
    try {
        if (trustedIps.indexOf(requestIP) < 0) throw new Error("Invalid IP aaddress")
        const transaction = await Transaction.findOne({ transferId: id })
        transaction.status = status
        await transaction.save()

        if ((transaction.method == "CARD" || transaction.method == "ACH" || transaction.method == "WYRE PAYMENT") && status == "COMPLETED") {
            await wyreTransfer(transaction.invoiceId)
            await wirePayout(transaction.invoiceId)
        }
        res.status(200).send()
    } catch (e) {
        res.status(400).send(e)
    }

}

//card transaction webhook
const getWalletOrderStatus = async (req, res) => {
    const { orderId, orderStatus, transferId } = req.body
    try {
        const invoiceInfo = await Invoice.findOne({ walletOrderId: orderId })
        if (transferId) {
            const transactionInfo = await Transaction.findOne({ transferId })
            if (!transactionInfo) {
                const newTransaction = new Transaction({
                    sender: invoiceInfo.businessEmail,
                    receiver: invoiceInfo.freelancerEmail,
                    method: "CARD",
                    transferId,
                    source: 'CARD',
                    sourceCurrency: 'USD',
                    destination: 'account:' + process.env.WYRE_ACCOUNT_ID,
                    destCurrency: 'USD',
                    amount: invoiceInfo.totalAmount,
                    invoiceId: invoiceInfo.invoiceId,
                    status: orderStatus
                });
                invoiceInfo.transferId = transferId;
                await invoiceInfo.save();
                await newTransaction.save();
            }
        }
        res.status(200).send();
    } catch (e) {
        res.status(400).send();
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