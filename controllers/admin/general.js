const crypto = require("crypto");
const jwt = require("jsonwebtoken");
var ObjectId = require("mongoose").Types.ObjectId;
const speakEasy = require("speakeasy")
const Business = require("../../models/business");
const Freelancer = require("../../models/freelancer");
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


module.exports = {
    getUsers,
    getAccount
}