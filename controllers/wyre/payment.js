const { wyre } = require("./boilerplate")
const Invoice = require("../../models/invoice");
const Transaction = require("../../models/transaction");

//create wallet oreder reservation
const debitCardQuote = async (req, res) => {

    //debitcard format - {number: '4111111111111111', year: '2023', month: '01', cvv: '123'}
    //address format - {street1: '1234 Test Ave', city: 'Los Angeles', state: 'CA', postalCode: '91423', country: 'US'}

    const { invoiceId, debitCard, currency, givenName, familyName, ipAddress, phone, address } = req.body
    let result, invoiceInfo
    try {
        invoiceInfo = await Invoice.findOne({ invoiceId });
        if (invoiceInfo.walletOrderId) {
            const walletOrderPayload = await wyre.get(`/orders/${invoiceInfo.walletOrderId}`)
            switch (walletOrderPayload.status) {
                case "PENDING":
                    return res.status(400).send({ error: "transfer is pending." })
                case "COMPLETED":
                    return res.status(400).send({ error: "transfer is already completed." })
                case "UNCONFIRMED":
                    return res.status(400).send({ error: "transfer is being processed." })
            }
        }
        result = await wyre.post('/debitcard/process/partner', {
            debitCard,
            reservationId: invoiceInfo.reservationId,
            amount: invoiceInfo.totalAmount,
            sourceCurrency: currency,
            destCurrency: 'USD',
            dest: process.env.WYRE_ACCOUNT_ID,
            referrerAccountId: process.env.WYRE_ACCOUNT_ID,
            givenName,
            familyName,
            email: invoiceInfo.clientEmail,
            ipAddress,
            phone,
            referenceId: process.env.WYRE_ACCOUNT_ID,
            address
        })
        const newTransaction = new Transaction({
            sender: invoiceInfo.businessEmail,
            receiver: invoiceInfo.freelancerEmail,
            method: "CARD",
            transferId: result.transferId,
            source: debitCard.number.substr(debitCard.number.length - 4),
            sourceCurrency: 'USD',
            destination: process.env.WYRE_ACCOUNT_ID,
            destCurrency: 'USD',
            amount: invoiceInfo.totalAmount
        });
        invoiceInfo.walletOrderId = result.id
        await invoiceInfo.save()
        await newTransaction.save()
        res.status(200).send(result)
    } catch (e) {
        res.status(400).send(e)
    }
}


//submit authorization - otp
const submitAuthorization = async (req, res) => {
    const { invoiceId, otp } = req.body
    let result

    try {
        const invoiceInfo = await Invoice.findOne({ invoiceId })
        if (!invoiceInfo.walletOrderId || !invoiceInfo.reservationId) {
            res.status(404).send()
        }
        const walletOrderPayload = await wyre.get(`/orders/${invoiceInfo.walletOrderId}`)
        if (walletOrderPayload.status !== "RUNNING_CHECKS") {
            res.status(400).send({ err: 'there was an error.' })
        }
        result = await wyre.post('/debitcard/authorize/partner', {
            type: 'SMS',
            walletOrderId: invoiceInfo.walletOrderId,
            reservation: invoiceInfo.reservationId,
            sms: otp,
        })
        if (result.success) {
            res.status(200).send({ success: "transfer is in progress" })
        } else {
            res.status(400).send({ error: "there was an error." })
        }
    } catch (e) {
        res.status(400).send({ error: "there was an error", message: e })
    }
}


//get wallet order status
const getWalletOrder = async (req, res) => {
    const { invoiceId } = req.body
    let result
    try {
        const invoiceInfo = Invoice.findOne({ invoiceId })
        if (!invoiceInfo.walletOrderId) {
            res.status(404).send({ error: "wallet order id not found" })
        }
        result = await wyre.get(`/orders/${invoiceInfo.walletOrderId}`)
        res.status(200).send(result)
    } catch (e) {
        res.status(400).send(e)
    }
}


// US Individual account
const createPaymentMethodIN = async (req, res) => {
    const { firstName, lastName, address, address2, city, postal, phone, state, day, month, year, accountNumber, accountType, routingNumber } = req.body
    const business = req.user
    let result

    try {
        result = await wyre.post('/paymentMethods', {
            paymentMethodType: 'INTERNATIONAL_TRANSFER',
            paymentType: 'LOCAL_BANK_WIRE',
            currency: 'USD',
            country: 'US',
            beneficiaryType: 'INDIVIDUAL',
            firstNameOnAccount: firstName,
            lastNameOnAccount: lastName,
            beneficiaryAddress: address,
            beneficiaryAddress2: address2,
            beneficiaryCity: city,
            beneficiaryPostal: postal,
            beneficiaryPhoneNumber: phone,
            beneficaryState: state,
            beneficiaryDobDay: day,
            beneficiaryDobMonth: month,
            beneficiaryDobYear: year,
            accountNumber: accountNumber,
            routingNumber: routingNumber,
            accountType: accountType,
            chargeablePM: false
        })
        await business.paymentMethods.push(result.id)
        await business.save()
    } catch (e) {
        res.status(400).send({ err: "There was an error" })
    }

    res.status(200).send(result)
}


// US Corporate account
const createPaymentMethodCO = async (req, res) => {
    const { company, email, einTin, accountNumber, accountType, routingNumber } = req.body
    const business = req.user
    let result

    try {
        result = await wyre.post('/paymentMethods', {
            paymentMethodType: 'INTERNATIONAL_TRANSFER',
            paymentType: 'LOCAL_BANK_WIRE',
            currency: 'USD',
            country: 'US',
            beneficiaryType: 'CORPORATE',
            beneficiaryCompanyName: company,
            beneficiaryEmailAddress: email,
            beneficiaryEinTin: einTin, //EIN or TIN
            accountNumber: accountNumber,
            routingNumber: routingNumber,
            accountType: accountType,
            chargeablePM: false
        })
        await business.paymentMethods.push(result.id)
        await business.save()
        res.status(200).send(result)
    } catch (e) {
        res.status(400).send({ err: "There was an error" })
    }
}

//upload bank document
const uploadBankDocument = async (req, res) => {
    const { paymentMethodId, formData } = req.body

    const options = {
        method: 'POST',
        url: `https://api.testwyre.com/v2/paymentMethod/${paymentMethodId}/followup`,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
            Authorization: 'Bearer ' + process.env.WYRE_SECRET_KEY
        },
        data: formData
    };

    let result

    try {
        result = await axios.request(options)
        res.status(200).send({ success: "document uploaded" })
    } catch (e) {
        res.status(400).send({ err: "There was an error." })
    }


}

//delete payment method
const deletePaymentMethod = async (req, res) => {
    const business = req.user
    const { id } = req.body
    try {
        const index = await business.paymentMethods.indexOf(id);
        if (index > -1) {
            business.paymentMethods.splice(index, 1);
        } else {
            res.status(404).send()
        }
        await business.save()
        res.status(200).send(business)
    } catch (e) {
        res.status(400).send({ err: "There was an error. Please try again later." })
    }
}

//get list of payment methods
const getPaymentMethods = async (req, res) => {
    const business = req.user
    const { id } = req.body

    try {
        var data = []
        for (var i = 0; i < business.paymentMethods.length; i++) {
            var res = await wyre.get('/paymentMethod/' + business.paymentMethods[i])
            data.push(res)
        }
        res.status(200).send(data)
    } catch (e) {
        res.status(400).send({ err: "There was an error" })
    }


}

// ACH transfer from payment method to master accoount
const ACHtransfer = async (req, res) => {
    const { invoiceId, paymentMethodId } = req.body
    let result
    try {

        const invoiceInfo = await Invoice.findOne({ invoiceId });
        if (invoiceInfo.ACHTransferId) {
            const prevResult = await wyre.get('/transfers' + invoiceInfo.ACHTransferId)
            if (prevResult.status == "PENDING" || prevResult.status == "COMPLETED" || prevResult.status == "UNCONFIRMED") {
                return res.status(400).send({ err: "payment being processed" })
            }
        } else {
            const PidStatus = await wyre.get('/paymentMethod/' + paymentMethodId)

            if (PidStatus.status !== 'ACTIVE') {
                return res.status(400).send({ error: "Payment Method not verified." })
            }

            result = await wyre.post('transfers', {
                source: 'paymentmethod:' + paymentMethodId,
                sourceCurrency: "USD",
                sourceAmount: invoiceInfo.totalAmount,
                dest: process.env.WYRE_ACCOUNT_ID, //master account
                destCurrency: "USD",
                autoConfirm: true
            })
            const newTransaction = new Transaction({
                sender: invoiceInfo.businessEmail,
                receiver: invoiceInfo.freelancerEmail,
                method: "ACH",
                transferId: result.transferId,
                source: 'paymentmethod:' + paymentMethodId,
                sourceCurrency: 'USD',
                destination: process.env.WYRE_ACCOUNT_ID,
                destCurrency: 'USD',
                amount: invoiceInfo.totalAmount
            });
            invoiceInfo.ACHTransferId = result.id
            await newTransaction.save()
            await invoiceInfo.save()
        }
        res.status(200).send({ success: "Payment initiated", result })
    } catch (e) {
        res.status(400).send({ err: "There was an error." })
    }

}


module.exports = {
    debitCardQuote,
    submitAuthorization,
    getWalletOrder,
    createPaymentMethodIN,
    createPaymentMethodCO,
    uploadBankDocument,
    deletePaymentMethod,
    getPaymentMethods,
    ACHtransfer
}