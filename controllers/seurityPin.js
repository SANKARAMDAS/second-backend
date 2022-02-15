const Business = require("../models/business");
const { sendEmail } = require("./sendEmail");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const Freelancer = require("../models/freelancer");

const setSecurityPin = async (req, res) => {
    const { pin, confirmPin } = req.body
    const user = req.user;
    console.log(req.body)
    try {
        if (!pin || !confirmPin || pin !== confirmPin) {
            throw new Error("Invalid Infomation")
        }
        if (user.securityPin != null) {
            throw new Error("PIN already exists. Try changing PIN in profile.")
        }
        user.securityPin = pin;
        await user.save();
        res.status(200).send()
    } catch (e) {
        res.status(400).send({ message: e.message });
    }
}

// Forgot Pin
const forgotPin = async (req, res) => {
    // const user = req.user
    try {
        const user = await Freelancer.findById("61efdc0346737324bdcf4f73");
        const token = await jwt.sign({ _id: user._id.toString() }, process.env.JWT_VERIFY, { expiresIn: 60 * 30 })
        const hash = await bcrypt.hash(token, 10);

        user.resetPinToken = hash;
        await user.save()

        const link = `localhost:3000/api/auth/passwordreset/${token}/${user._id}`;
        const emailBody = `<p> Hey ${user.name} <br/>
                            Your reset security pin link is: <br/>
                            <a href=${link}>Reset Pin</a></p>`;

        // await sendEmail({ email: user.email }, emailBody, "Pin Reset");

        res.status(200).send({
            msg: "PIN reset link sent successfully",
            data: { link, email: user.email }
        });

    } catch (err) {
        console.log(err)
        res.status(400).send({ message: err.message });
    }
};

// Pin Reset
const pinReset = async (req, res) => {
    const { userId, resetPinToken, newPin, newPin2 } = req.body;
    try {

        if (newPin !== newPin2) throw new Error("PINs don't match");

        var user = await Business.findById(userId);
        if (!user) user = await Freelancer.findById(userId);

        if (!user) {
            throw new Error("Invalid userId");
        }

        if (!user.resetPinToken) throw new Error("Invalid or expired PIN reset token");
        const isValid = await bcrypt.compare(resetPinToken, user.resetPinToken);
        if (!isValid) throw new Error("Invalid or expired PIN reset token");

        const payload = jwt.verify(resetPinToken, process.env.JWT_VERIFY);
        if (payload._id != userId) throw new Error("Invalid or expired PIN reset token 1");

        user.securityPin = newPin
        user.resetPinToken = ""
        await user.save()
        res.status(200).send({ message: "PIN has been changed." })
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
};

module.exports = {
    setSecurityPin,
    forgotPin,
    pinReset
}