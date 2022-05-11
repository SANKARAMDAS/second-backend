const { wyre } = require("./boilerplate")
const Invoice = require("../../models/invoice");
const Transaction = require("../../models/transaction");
const Business = require("../../models/business");
const Freelancer = require("../../models/freelancer");
var spreedly = require('spreedly-api')(process.env.SPREEDLY_API_KEY, process.env.SPREEDLY_SECRET);
const axios = require("axios")

const FormData = require('form-data')
const fs = require('fs');
const invoice = require("../invoice");

const token = `${process.env.SPREEDLY_API_KEY}:${process.env.SPREEDLY_SECRET}`;
const encodedToken = Buffer.from(token).toString('base64');

const instance = axios.create({
    headers: {
        'Authorization': `Basic ${encodedToken}`,
        'Content-type': 'application/json',
        'Host': 'core.spreedly.com',
    }
});

const deliverSpreedly = async (buyRequest, paymentMethodToken) => {
    const url = "https://api.testwyre.com/v3/debitcard/process/partner";
    const requestBody = {
        "delivery": {
            "payment_method_token": paymentMethodToken,
            "url": url,
            "headers": `Content-Type: application/json\nAuthorization: Bearer ${process.env.WYRE_SECRET_KEY}`,
            "body": "{ \"product_id\": \"916598\", \"card_number\": \"{{credit_card_number}}\" }"
        }
    };
    const delivery = await instance.post(`https://core.spreedly.com/v1/receivers/${process.env.SPREEDLY_RECEIVER}/deliver.json`, requestBody)
    console.log(delivery.data)
    return delivery;
}

const createReceiver = async (req, res) => {
    try {
        const result = await instance.post('https://core.spreedly.com/v1/receivers.json', {
            "receiver": {
                "receiver_type": "test",
                "hostnames": "https://spreedly-echo.herokuapp.com",
            }
        })
        console.log(result)
        res.status(200).send()
    } catch (e) {
        console.log(e)
        res.status(400).send({ message: e.message })
    }
}

// const verifyCreditCard = async (req, res) => {
//     try {
//         const result = await instance.post(`/v1/gateways/${process.env.GATEWAY_TOKEN}/verify.json`, {
//             "transaction": {
//                 "payment_method_token": "1JKtjshdgf9ThB9EQws46Ef59BK",
//                 "retain_on_success": true
//             }
//         })
//         res.status(200).send(result)
//     } catch (e) {
//         console.log(e)
//         res.status(400).send({ message: e.message })
//     }
// }


//create wallet oreder reservation

const debitCardQuote2 = async (req, res) => {

    //debitcard format - {number: '4111111111111111', year: '2023', month: '01', cvv: '123'}
    //address format - {street1: '1234 Test Ave', city: 'Los Angeles', state: 'CA', postalCode: '91423', country: 'US'}

    const { invoiceId, paymentMethodToken, currency, givenName, familyName, ipAddress, phone, address, saveCard } = req.body

    try {
        // const user = req.user
        const user = await Business.findById("626da3475b405b1768c05e2d")

        const resulttemp = await instance.post(`https://core.spreedly.com/v1/gateways/${process.env.GATEWAY_TOKEN}/verify.json`, {
            "transaction": {
                "payment_method_token": paymentMethodToken,
                "currency": "usd",
                "description": "Software development services",
                "retain_on_success": true
            }
        })

        // console.log(resulttemp)

        const invoiceInfo = await Invoice.findOne({ invoiceId });

        if (invoiceInfo.walletOrderId) {
            const resultTemp = await wyre.get('/v3/orders/' + invoiceInfo.walletOrderId)
            console.log(resultTemp)
            if (resultTemp.status == "RUNNING_CHECKS") return res.status(400).send({ message: "previous transaction is being processed" })
            if (resultTemp.transferId) {
                const tresultTemp = await wyre.get('/v2/transfer/' + resultTemp.transferId + '/track')
                const transferPrevStatus = tresultTemp.successTimeline.at(-1).state
                if (transferPrevStatus == 'COMPLETED' || transferPrevStatus == 'PENDING' || transferPrevStatus == 'UNCONFIRMED') {
                    return res.status(400).send({ message: `Previous transaction status - ${transferPrevStatus}` })
                }
            }
        }

        const newWalletOrder = await wyre.post('/v3/orders/reserve', { referrerAccountId: process.env.WYRE_ACCOUNT_ID })

        const amountinstring = invoiceInfo.totalAmount.toString()

        const userDebitCard = {
            number: "{{ credit_card_number }}",
            year: "{{ credit_card_year }}",
            month: "{{#format_date}}%m,{{ credit_card_expiration_date }}{{/format_date}}",
            cvv: "{{ credit_card_verification_value }}"
        };

        const buyRequest = {
            debitCard: userDebitCard,
            reservationId: newWalletOrder.reservation,
            amount: amountinstring,
            sourceCurrency: currency,
            destCurrency: 'ETH',
            dest: 'account:' + process.env.WYRE_ACCOUNT_ID,
            referrerAccountId: process.env.WYRE_ACCOUNT_ID,
            givenName,
            familyName,
            email: invoiceInfo.businessEmail,
            ipAddress,
            phone,
            referenceId: process.env.WYRE_ACCOUNT_ID,
            address
        };


        const result = await deliverSpreedly(buyRequest, paymentMethodToken)

        if (!result.data.transaction.response.body.id) {
            return res.status(500).send(result.data.transaction.response.body)
        }

        if (saveCard == 1) {
            user.paymentMethods.push({ paymentMethodId: paymentMethodToken })
            await user.save()
        }

        invoiceInfo.walletOrderId = result.data.transaction.response.body.id
        invoiceInfo.reservationId = newWalletOrder.reservation
        await invoiceInfo.save()
        const newTransaction = new Transaction({
            sender: invoiceInfo.businessEmail,
            receiver: invoiceInfo.freelancerEmail,
            method: "CARD",
            walletOrderId: result.data.transaction.response.body.id,
            source: 'card',
            sourceCurrency: 'USD',
            destination: 'account:' + process.env.WYRE_ACCOUNT_ID,
            destinationCurrency: 'USDC',
            amount: invoiceInfo.totalAmount,
            invoiceId
        });
        await newTransaction.save()

        res.status(200).send({ result: result.data.transaction.response.body, reservation: newWalletOrder.reservation })
        res.send(result)

    } catch (e) {
        console.log(e)
        res.status(400).send(e)
    }
}

const getSavedCards = async (req, res) => {
    const user = req.user
    try {


        if (req.role == 'freelancer') {
            return res.status(400).send({ message: "invalid request" })
        }

        const savedCards = user.paymentMethods

        if (!savedCards.length) {
            return res.status(400).send({ message: "no payment methods found." })
        }

        var finalresult = new Array(savedCards.length)

        for (var i = 0; i < savedCards.length; i++) {

            const result = await instance.get(`https://core.spreedly.com/v1/payment_methods/${savedCards[i].paymentMethodId}.json`)

            finalresult[i] = {
                "number": result.data.payment_method.number,
                "token": result.data.payment_method.token,
                "card_type": result.data.payment_method.card_type
            }

        }

        console.log(finalresult)

        res.status(200).send({ result: finalresult })

    } catch (e) {
        res.status(400).send({ message: e.message })
    }
}

//submit invoice authorization - otp

const debitCardQuote = async (req, res) => {
    //debitcard format - {number: '4111111111111111', year: '2023', month: '01', cvv: '123'}
    //address format - {street1: '1234 Test Ave', city: 'Los Angeles', state: 'CA', postalCode: '91423', country: 'US'}
    const { invoiceId, debitCard, currency, givenName, familyName, ipAddress, phone, address } = req.body

    try {
        const invoiceInfo = await Invoice.findOne({ invoiceId });

        if (invoiceInfo.walletOrderId) {
            const resultTemp = await wyre.get('/v3/orders/' + invoiceInfo.walletOrderId)
            console.log(resultTemp)
            if (resultTemp.status == "RUNNING_CHECKS") return res.status(400).send({ message: "previous transaction is being processed" })
            if (resultTemp.transferId) {
                const tresultTemp = await wyre.get('/v2/transfer/' + resultTemp.transferId + '/track')
                const transferPrevStatus = tresultTemp.successTimeline.at(-1).state
                if (transferPrevStatus == 'COMPLETED' || transferPrevStatus == 'PENDING' || transferPrevStatus == 'UNCONFIRMED') {
                    return res.status(400).send({ message: `Previous transaction status - ${transferPrevStatus}` })
                }
            }
        }
        // if (invoiceInfo.transferId) {
        //     const transferPayload = await wyre.get(`/v3/transfers/${invoiceInfo.transferId}`)
        //     if (transferPayload.status == 'COMPLETE' || transferPayload.status == 'PENDING' || transferPayload.status == 'UNCONFIRMED') {
        //         return res.status(400).send({ message: `Previous transaction status - ${transferPayload.status}` })
        //     }
        // }

        const newWalletOrder = await wyre.post('/v3/orders/reserve', { referrerAccountId: process.env.WYRE_ACCOUNT_ID })

        const amountinstring = invoiceInfo.totalAmount.toString()

        result = await wyre.post('/v3/debitcard/process/partner', {
            debitCard,
            reservationId: newWalletOrder.reservation,
            amount: amountinstring,
            sourceCurrency: currency,
            destCurrency: 'USD',
            dest: "account:" + process.env.WYRE_ACCOUNT_ID,
            referrerAccountId: process.env.WYRE_ACCOUNT_ID,
            givenName,
            familyName,
            email: invoiceInfo.businessEmail,
            ipAddress,
            phone,
            referenceId: process.env.WYRE_ACCOUNT_ID,
            address
        })
        console.log(result)

        invoiceInfo.walletOrderId = result.id
        invoiceInfo.reservationId = newWalletOrder.reservation
        await invoiceInfo.save()
        const newTransaction = new Transaction({
            sender: invoiceInfo.businessEmail,
            receiver: invoiceInfo.freelancerEmail,
            method: "CARD",
            walletOrderId: result.id,
            source: 'card',
            sourceCurrency: 'USD',
            destination: 'account:' + process.env.WYRE_ACCOUNT_ID,
            destinationCurrency: 'USDC',
            amount: invoiceInfo.totalAmount,
            invoiceId
        });
        await newTransaction.save()
        res.status(200).send({ result, reservation: newWalletOrder.reservation })
    } catch (e) {
        console.log(e)
        res.status(400).send(e)
    }
}

const submitAuthorization = async (req, res) => {
    const { invoiceId, otp, authCode } = req.body
    let result

    try {
        const invoiceInfo = await Invoice.findOne({ invoiceId })
        if (!invoiceInfo.walletOrderId || !invoiceInfo.reservationId) {
            return res.status(404).send({ message: "Wallet Order not found." })
        }
        const walletOrderPayload = await wyre.get(`/v3/orders/${invoiceInfo.walletOrderId}`)

        if (walletOrderPayload.status !== "RUNNING_CHECKS") {
            return res.status(400).send({ message: `Transaction status - ${walletOrderPayload.status}` })
        }
        const authPayload = await wyre.get('/v3/debitcard/authorization/' + invoiceInfo.walletOrderId)
        if (authPayload.smsNeeded && otp == null || authPayload.card2faNeeded && authCode == null) {
            return res.status(400).send({ message: "Insufficient details" })
        }

        if (authPayload.smsNeeded && authPayload.card2faNeeded) {
            result = await wyre.post('/v3/debitcard/authorize/partner', {
                type: 'ALL',
                walletOrderId: invoiceInfo.walletOrderId,
                reservation: invoiceInfo.reservationId,
                sms: otp,
                card2fa: authCode
            })
        } else if (authPayload.smsNeeded && !authPayload.card2faNeeded) {
            result = await wyre.post('/v3/debitcard/authorize/partner', {
                type: 'SMS',
                walletOrderId: invoiceInfo.walletOrderId,
                reservation: invoiceInfo.reservationId,
                sms: otp,
            })
        } else {
            result = await wyre.post('/v3/debitcard/authorize/partner', {
                type: 'CARD2FA',
                walletOrderId: invoiceInfo.walletOrderId,
                reservation: invoiceInfo.reservationId,
                card2fa: authCode,
            })
        }

        if (result.success) {
            invoiceInfo.status = "INITIATED"
        }

        await invoiceInfo.save()

        res.status(200).send(result)

    } catch (e) {
        res.status(400).send(e)
    }
}

const getAuthorization = async (req, res) => {
    const { invoiceId } = req.body
    try {
        const invoiceInfo = await Invoice.findOne({ invoiceId })
        if (!invoiceInfo.walletOrderId.length) {
            return res.status(404).send({ message: "initiate the payment first." })
        }
        const result = await wyre.get(`/v3/debitCard/authorization/${invoiceInfo.walletOrderId}`)
        res.status(200).send(result)
    } catch (e) {
        res.status(400).send({ message: e.message })
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
        result = await wyre.get(`/v3/orders/${invoiceInfo.walletOrderId}`)
        res.status(200).send(result)
    } catch (e) {
        res.status(400).send(e)
    }
}

// US Individual account
const createPaymentMethodIN = async (req, res) => {
    const { firstName, lastName, address, address2, city, postal, phone, state, day, month, year, accountNumber, accountType, routingNumber } = req.body
    // const business = req.user
    const business = await Business.findOne({ email: "gitanshwadhwa0028@gmail.com" })
    let result

    try {
        result = await wyre.post('/v2/paymentMethods', {
            paymentMethodType: 'LOCAL_TRANSFER',
            paymentType: 'LOCAL_TRANSFER',
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
        await business.paymentMethods.push({ paymentMethodId: result.id })
        await business.save()
        res.status(200).send(result)
    } catch (e) {
        res.status(400).send(e)
    }

}

// US Corporate account
const createPaymentMethodCO = async (req, res) => {
    const { company, email, einTin, accountNumber, accountType, routingNumber } = req.body
    const business = req.user
    let result

    try {
        result = await wyre.post('/paymentMethods', {
            paymentMethodType: 'LOCAL_TRANSFER',
            paymentType: 'LOCAL_TRANSFER',
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
        await business.paymentMethods.push({ paymentMethodId: result.id })
        await business.save()
        res.status(200).send(result)
    } catch (e) {
        res.status(400).send({ err: "There was an error" })
    }
}

//upload bank document
const uploadBankDocument = async (req, res) => {

    const paymentMethodId = req.body.paymentMethodId
    console.log(req.file, req.body.paymentMethodId)

    const form = new FormData();
    form.append('document', req.file.buffer, req.file.originalname);

    const options = {
        method: 'POST',
        url: `https://api.testwyre.com/v2/paymentMethod/${paymentMethodId}/followup`,
        headers: {
            Authorization: 'Bearer ' + process.env.WYRE_SECRET_KEY,
            ...form.getHeaders()
        },
        data: form
    };

    let result

    try {
        result = await axios.request(options)
        console.log(result)
        res.status(200).send({ success: "document uploaded" })
    } catch (e) {
        // console.log(e)
        res.status(400).send({ err: "There was an error." })
    }


}

//delete payment method
const deletePaymentMethod = async (req, res) => {
    const user = req.user
    const { id } = req.body
    try {
        const index = await user.paymentMethods.indexOf(id);
        if (index > -1) {
            user.paymentMethods.splice(index, 1);
        } else {
            res.status(404).send()
        }
        await user.save()
        res.status(200).send(user)
    } catch (e) {
        res.status(400).send({ message: e.message })
    }
}

//get list of payment methods
const getPaymentMethods = async (req, res) => {
    const user = req.user

    try {
        var data = []
        for (var i = 0; i < user.paymentMethods.length; i++) {
            var res2 = await wyre.get('/v2/paymentMethod/' + user.paymentMethods[i].paymentMethodId)
            data.push(res2)
        }
        res.status(200).send(data)
    } catch (e) {
        res.status(400).send({ message: e.message })
    }


}

// ACH transfer from payment method to master accoount
const ACHtransfer = async (req, res) => {
    const { invoiceId, paymentMethodId } = req.body
    let result
    try {
        const invoiceInfo = await Invoice.findOne({ invoiceId });

        if (invoiceInfo.walletOrderId) {
            const resultTemp = await wyre.get('/v3/orders/' + invoiceInfo.walletOrderId)
            console.log(resultTemp)
            if (resultTemp.status == "RUNNING_CHECKS") return res.status(400).send({ message: "previous transaction is being processed" })
            if (resultTemp.transferId) {
                const tresultTemp = await wyre.get('/v2/transfer/' + resultTemp.transferId + '/track')
                const transferPrevStatus = tresultTemp.successTimeline.at(-1).state
                if (transferPrevStatus == 'COMPLETE' || transferPrevStatus == 'PENDING' || transferPrevStatus == 'UNCONFIRMED') {
                    return res.status(400).send({ message: `Previous transaction status - ${transferPrevStatus}` })
                }
            }
        }
        if (invoiceInfo.transferId) {
            const transferPayload = await wyre.get(`/v3/transfers/${invoiceInfo.transferId}`)
            if (transferPayload.status == 'COMPLETE' || transferPayload.status == 'PENDING' || transferPayload.status == 'UNCONFIRMED') {
                return res.status(400).send({ message: `Previous transaction status - ${transferPayload.status}` })
            }
        }

        const PidStatus = await wyre.get('/v3/paymentMethod/' + paymentMethodId)

        if (PidStatus.status !== 'ACTIVE') {
            return res.status(400).send({ message: "Payment Method not verified." })
        }

        result = await wyre.post('/v3/transfers', {
            source: 'paymentmethod:' + paymentMethodId,
            sourceCurrency: "USD",
            sourceAmount: invoiceInfo.totalAmount,
            dest: 'account:' + process.env.WYRE_ACCOUNT_ID, //master account
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
            destination: 'account:' + process.env.WYRE_ACCOUNT_ID,
            destCurrency: 'USD',
            amount: invoiceInfo.totalAmount,
            invoiceId
        });
        invoiceInfo.transferId = result.id
        await newTransaction.save()
        await invoiceInfo.save()

        res.status(200).send(result)
    } catch (e) {
        res.status(400).send({ message: e.message })
    }

}

// create swift payment method
const createSwiftPaymentMethod = async (req, res) => {
    const { name, accountNumber, swiftBic } = req.body
    const user = req.user
    let result

    try {
        // const user = await Freelancer.findById('624a874c14a1bd0c9bc02761')
        result = await wyre.post('/v2/paymentMethods', {
            paymentMethodType: 'INTERNATIONAL_TRANSFER',
            paymentType: 'LOCAL_BANK_WIRE',
            currency: 'USD',
            country: 'IN',
            beneficiaryType: 'INDIVIDUAL',
            beneficiaryName: name,
            accountNumber: accountNumber,
            swiftBic: swiftBic,
            chargeablePM: false
        })
        console.log(result)
        await user.paymentMethods.push({ paymentMethodId: result.id })
        await user.save()
        res.status(200).send(result)
    } catch (e) {
        res.status(400).send(e)
    }
}

// fund wallet using debit card
const fundwallet = async (req, res) => {
    const user = req.user;
    const { amount, paymentMethodToken, givenName, familyName, ipAddress, phone, address } = req.body

    try {

        var n = user.fundWallet.length
        if (n != 0) {
            if (user.fundWallet[n - 1].walletOrderId) {
                const result = await wyre.get('/v3/orders/' + user.fundWallet[n - 1].walletOrderId)
                if (result.status == "RUNNING_CHECKS") res.status(400).send({ message: "previous transaction is being processed" })
                if (result.transferId) {
                    const tresult = await wyre.get('/v2/transfers/' + result.transferId + '/track')
                    if (tresult.status == 'PENDING' || tresult.status == 'UNCONFIRMED') {
                        return res.status(400).send({ message: "previous transaction is being processed." })
                    }
                }
            } else {
                const result = await wyre.get('/v3/transfers/' + user.fundWallet[n - 1].transferId)
                if (result.status == 'PENDING' || result.status == 'UNCONFIRMED') {
                    return res.status(400).send({ message: "previous transaction is being processed" })
                }
            }
        }

        const reservationResult = await wyre.post('/v3/orders/reserve', { referrerAccountId: process.env.WYRE_ACCOUNT_ID })


        const userDebitCard = {
            number: "{{ credit_card_number }}",
            year: "{{ credit_card_year }}",
            month: "{{#format_date}}%m,{{ credit_card_expiration_date }}{{/format_date}}",
            cvv: "{{ credit_card_verification_value }}"
        };

        const buyRequest = {
            userDebitCard,
            reservationId: reservationResult.id,
            amount,
            sourceCurrency: 'USD',
            destCurrency: 'USD',
            dest: 'wallet:' + user.wyreWallet,
            referrerAccountId: process.env.WYRE_ACCOUNT_ID,
            givenName,
            familyName,
            email: user.email,
            ipAddress,
            phone,
            referenceId: process.env.WYRE_ACCOUNT_ID,
            address
        };

        const result = await deliverSpreedly(buyRequest, paymentMethodToken)

        console.log(result)


        // const result2 = await wyre.get('/v3/debitcard/authorization/' + walletorderresult.id)
        await user.fundWallet.push({ amount, reservationId: reservationResult.id, walletOrderId: walletorderresult.id });
        await user.save();
        res.status(200).send({ amount, walletOrderId: walletorderresult.id })
    } catch (e) {
        res.status(400).send({ message: e.message });
    }
}


// submit authorization 2
const submitAuthorization2 = async (req, res) => {
    const { reservationId, walletOrderId, otp, authCode } = req.body
    const user = req.user;

    var n = user.fundWallet.length
    if (n == 0 || user.fundWallet[n - 1].walletOrderId != walletOrderId || user.fundWallet[n - 1].reservationId != reservationId) {
        return res.status(400).send({ error: "wallet order does not exist." });
    }

    try {
        const walletorderresult = await wyre.get('/v3/orders/' + walletOrderId)
        if (walletorderresult.status !== "RUNNING_CHECKS") return res.status(400).send({ message: walletorderresult.status });

        const authPayload = await wyre.get('/v3/debitcard/authorization/' + walletOrderId)
        if (authPayload.smsNeeded && otp == null || card2faNeeded && authCode == null) {
            res.status(400).send({ message: "insufficient details" })
        }
        let result;
        if (smsNeeded && card2faNeeded) {
            result = await wyre.post('/v3/debitcard/authorize/partner', {
                type: 'ALL',
                walletOrderId: invoiceInfo.walletOrderId,
                reservation: invoiceInfo.reservationId,
                sms: otp,
                card2fa: authCode
            })
        } else if (smsNeeded && !card2faNeeded) {
            result = await wyre.post('/v3/debitcard/authorize/partner', {
                type: 'SMS',
                walletOrderId: invoiceInfo.walletOrderId,
                reservation: invoiceInfo.reservationId,
                sms: otp,
            })
        } else {
            result = await wyre.post('/v3/debitcard/authorize/partner', {
                type: 'CARD2FA',
                walletOrderId: invoiceInfo.walletOrderId,
                reservation: invoiceInfo.reservationId,
                card2fa: authCode,
            })
        }
        if (result.success) {
            return res.status(200).send({ message: "transfer is in progress" })
        } else {
            return res.status(400).send({ message: "there was an error." })
        }
    } catch (e) {
        res.status(400).send({ error: e.message })
    }

}

//fund walleet ACH
const fundWalletACH = async (req, res) => {
    const { paymentMethodId, amount } = req.body
    const user = req.user
    try {
        var n = user.fundWallet.length
        if (n != 0) {
            if (user.fundWallet[n - 1].walletOrderId) {
                const result = await wyre.get('/v3/orders/' + user.fundWallet[n - 1].walletOrderId)
                if (result.status == "RUNNING_CHECKS") res.status(400).send({ message: "previous transaction is being processed" })
                if (result.transferId) {
                    const tresult = await wyre.get('/v2/transfers/' + result.transferId + '/track')
                    if (tresult.status == 'PENDING' || tresult.status == 'UNCONFIRMED') {
                        return res.status(400).send({ message: "previous transaction is being processed." })
                    }
                }
            } else {
                const result = await wyre.get('/v3/transfers/' + user.fundWallet[n - 1].transferId)
                if (result.status == 'PENDING' || result.status == 'UNCONFIRMED') {
                    return res.status(400).send({ message: "previous transaction is being processed" })
                }
            }
        }

        const PidStatus = await wyre.get('/v3/paymentMethod/' + paymentMethodId)

        if (PidStatus.status !== 'ACTIVE') {
            return res.status(400).send({ message: "Payment Method not verified." })
        }

        const transferResult = await wyre.post('/transfers', {
            source: 'paymentmethod:' + paymentMethodId,
            sourceCurrency: "USD",
            sourceAmount: amount,
            dest: 'wallet:' + user.wyreWallet, //master account
            destCurrency: "USD",
            autoConfirm: true
        })

        await user.fundWallet.push({ amount, transferId: transferResult.id })
        await user.save()

        res.status(200).send(transferResult)

    } catch (e) {
        res.status(400).send({ message: e.message })
    }

}

// wyre wallet payment
const wyreWalletPayment = async (req, res) => {
    //currency USD or USDC
    const { invoiceId, currency, securityPin } = req.body
    const user = req.user
    let result
    try {
        if (!securityPin) return res.status(400).send({ message: "Enter Security pin." })
        if (!user.securityPin) return res.status(404).send({ message: "Set up new security pin in profile" })

        const isValid = await bcrypt.compare(securityPin, user.securityPin)

        if (!isValid) return res.status(400).send({ message: "Incorrect security pin." })

        const invoiceInfo = await Invoice.findOne({ invoiceId });

        if (invoiceInfo.walletOrderId) {
            const resultTemp = await wyre.get('/v3/orders/' + invoiceInfo.walletOrderId)
            console.log(resultTemp)
            if (resultTemp.status == "RUNNING_CHECKS") return res.status(400).send({ message: "previous transaction is being processed" })
            if (resultTemp.transferId) {
                const tresultTemp = await wyre.get('/v2/transfer/' + resultTemp.transferId + '/track')
                const transferPrevStatus = tresultTemp.successTimeline.at(-1).state
                if (transferPrevStatus == 'COMPLETE' || transferPrevStatus == 'PENDING' || transferPrevStatus == 'UNCONFIRMED') {
                    return res.status(400).send({ message: `Previous transaction status - ${transferPrevStatus}` })
                }
            }
        }
        if (invoiceInfo.transferId) {
            const transferPayload = await wyre.get(`/v3/transfers/${invoiceInfo.transferId}`)
            if (transferPayload.status == 'COMPLETE' || transferPayload.status == 'PENDING' || transferPayload.status == 'UNCONFIRMED') {
                return res.status(400).send({ message: `Previous transaction status - ${transferPayload.status}` })
            }
        }

        const walletpayload = await wyre.get('/v3/wallet/' + user.wyreWallet)

        let amount1

        if (currency === "USD") amount1 = invoiceInfo.totalAmount
        else {
            const exRates = await wyrre.get('/v3/rates?as=MULTIPLIER')
            amount1 = invoiceInfo.totalAmount * exRates["USDUSDC"]
        }


        if (walletpayload.balances[currency] < amount1) {
            return res.status(400).send({ message: "insufficient balance!" })
        }

        result = await wyre.post('/v3/transfers', {
            source: 'wallet:' + user.wyreWallet,
            sourceCurrency: currency,
            sourceAmount: invoiceInfo.totalAmount,
            dest: 'account:' + process.env.WYRE_ACCOUNT_ID, //master account
            destCurrency: "USD",
            autoConfirm: true
        })
        const newTransaction = new Transaction({
            sender: invoiceInfo.businessEmail,
            receiver: invoiceInfo.freelancerEmail,
            method: "WYRE PAYMENT",
            transferId: result.transferId,
            source: 'wallet:' + user.wyreWallet,
            sourceCurrency: currency,
            destination: 'account:' + process.env.WYRE_ACCOUNT_ID,
            destCurrency: 'USD',
            amount: invoiceInfo.totalAmount,
            invoiceId
        });
        invoiceInfo.transferId = result.id
        await newTransaction.save()
        await invoiceInfo.save()

        res.status(200).send(result)
    } catch (e) {
        res.status(400).send({ message: e.message })
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
    ACHtransfer,
    createSwiftPaymentMethod,
    fundwallet,
    submitAuthorization2,
    wyreWalletPayment,
    // createCreditCard,
    createReceiver,
    debitCardQuote2,
    getSavedCards,
    getAuthorization
    // verifyCreditCard
}