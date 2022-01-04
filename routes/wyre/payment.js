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
    ACHtransfer
} = require("../../controllers/wyre/payment");

const { auth } = require("../../middlewares/auth");
const router = express.Router();

router.post("/debitCardQuote", auth, debitCardQuote);
router.post("/submitAuthorization", auth, submitAuthorization);
router.get("/walletOrder", auth, getWalletOrder);
router.post("/createPaymentMethodIN", auth, createPaymentMethodIN);
router.post("/createPaymentMethodCO", auth, createPaymentMethodCO);
router.post("/uploadBankDocument", auth, uploadBankDocument);
router.post("/deletePaymentMethod", auth, deletePaymentMethod);
router.get("/paymentMethods", auth, getPaymentMethods);
router.post("/ACHtransfer", auth, ACHtransfer);

module.exports = router;
