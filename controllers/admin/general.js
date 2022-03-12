const crypto = require("crypto");
const jwt = require("jsonwebtoken");
var ObjectId = require("mongoose").Types.ObjectId;
const speakEasy = require("speakeasy")
const Business = require("../../models/business");
const Freelancer = require("../../models/freelancer");
const Transaction = require("../../models/transaction")
const Admin = require("../../models/admin");
const { sendEmail } = require("../sendEmail");
const bcrypt = require("bcrypt")
const { wyre } = require("../wyre/boilerplate");


const getUsers = async (req, res) => {
    try {
        const freelancer = await Freelancer.find()
        const business = await Business.find()
        res.status(200).send({ freelancer, business })
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }

}

const getAccount = async (req, res) => {
    try {
        const result = await wyre.get('/v2/account');
        res.status(200).send({ availableBalances: result.availableBalances, totalBalances: result.totalBalances })
    } catch (e) {
        res.status(400).send()
    }
}

const getTotalTransfer = async (req, res) => {
    try {
        var result = 0;
        const res2 = await Transaction.find();
        for (var i = 0; i < res2.length; i++) {
            if (res2[i].status === "COMPLETED") {
                result += parseFloat(res2[i].amount)
            }
        }
        res.statuw(200).send({ totalAmount: result })
    } catch (e) {
        res.status(400).send()
    }
}

const getTransactions = async (req, res) => {
    const { startTime, endTime } = req.body
    if (!startTime) startTime = 0;
    const date = new Date()
    if (!endTime) endTime = date.getTime()

    let result;
    var finResult = []
    try {
        result = await Transaction.find()
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



module.exports = {
    getUsers,
    getAccount,
    getTotalTransfer,
    getTransactions
}