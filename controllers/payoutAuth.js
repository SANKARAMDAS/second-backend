const Freelancer = require("../models/freelancer");
const speakeasy = require("speakeasy")
const QRCode = require("qrcode")

const enable2fa = async (req, res) => {
    const user = req.user
    try {
        console.log(user)
        if (user.is2faenabledPayout === true) return res.status(400).send({ message: "2fa already enabled" })
        var temp_secret = speakeasy.generateSecret();
        const qrcode = await QRCode.toDataURL(temp_secret.otpauth_url)
        user.tempSecretPayout = temp_secret.base32
        user.qrUrlPayout = qrcode
        await user.save()
        res.status(200).send({ temp: temp_secret.base32, data_url: qrcode })
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
}

const disable2fa = async (req, res) => {
    const user = req.user
    const { token } = req.body
    try {
        const secret = user.tempSecretPayout;
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token
        });
        if (verified) {
            user.is2faenabledPayout = false
            user.tempSecretPayout = ''
            user.qrUrlPayout = ''
            await user.save()
            return res.status(200).send()
        } else {
            return res.status(400).send()
        }
    } catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
}

const verify2fa = async (req, res) => {
    const user = req.user
    const { token } = req.body;
    try {
        const secret = user.tempSecretPayout;
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token
        });
        console.log(verified)
        if (verified) {
            user.is2faenabledPayout = true
            await user.save()
            return res.status(200).send()
        } else {
            return res.status(400).send()
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving user' })
    };
}

module.exports = {
    verify2fa,
    enable2fa,
    disable2fa
}