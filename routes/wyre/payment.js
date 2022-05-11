const express = require("express");
const {
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
    getAuthorization,
    getSavedCards,
    // createCreditCard,
    createReceiver,
    debitCardQuote2
    // verifyCreditCard
} = require("../../controllers/wyre/payment");

const { auth } = require("../../middlewares/auth");
const router = express.Router();
const upload = require('multer')();

//card payment//
// router.post("/createCreditCard", createCreditCard)
router.post("/createReceiver", createReceiver)
// router.post("/verifyCard", verifyCreditCard)

//initiate card payment
router.post("/debitCardQuote", debitCardQuote);
//initiate card payment - spreedly
router.post("/debitCardQuote2", debitCardQuote2);
//get authorization
router.post("/getAuthorization", auth, getAuthorization);
//get saved cards
router.get("/getcards", getSavedCards);
//submit otp
router.post("/submitAuthorization", auth, submitAuthorization);
//get wallet order
router.get("/walletOrder", getWalletOrder);

//ACH payment//

//add bank account - individual
router.post("/createPaymentMethodIN", createPaymentMethodIN);
//add bank account - corporate
router.post("/createPaymentMethodCO", auth, createPaymentMethodCO);
//upload bank statement
router.post("/uploadBankDocument", upload.single("document"), uploadBankDocument);
//delete bank account
router.post("/deletePaymentMethod", auth, deletePaymentMethod);
//get user's payment methods
router.get("/paymentMethods", auth, getPaymentMethods);
//initiate ACH transfer
router.post("/ACHtransfer", auth, ACHtransfer);

//Wire Payout//
router.post('/createSwiftPaymentMethod', auth, createSwiftPaymentMethod);


//pay using wallet//

//fund wallet using debit card
router.post('/fundWallet', auth, fundwallet);
//submit otp
router.post('/submitAuthFund', auth, submitAuthorization2)
//make paymment
router.post('/wyrePayment', auth, wyreWalletPayment)


module.exports = router;
