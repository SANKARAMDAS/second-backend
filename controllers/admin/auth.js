const crypto = require("crypto");
const jwt = require("jsonwebtoken");
var ObjectId = require("mongoose").Types.ObjectId;
const speakEasy = require("speakeasy")
const Business = require("../../models/business");
const Admin = require("../../models/admin");
const { sendEmail } = require("../sendEmail");
const bcrypt = require("bcrypt")



const addUser = async (req, res) => {
    const { name, email } = req.body;

    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var password = '';
    for (var i = 0; i < 8; i++) {
        password += characters[Math.floor(Math.random() * characters.length)];
    }
    try {
        const user = await Admin.findOne({ email })
        if (user) {
            return res.status(400).send({ message: "Email already registered" })
        }

        console.log(password)
        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = new Admin({
            name: name,
            password: hashedPassword,
            email: email,
            role: "0"
        });

        const savedUser = await newUser.save();

        const emailBody = `
        <div>
        	<p style="font-weight: bold;" >Hello ${name},</p>
        	<p>Your Binamite admin credentials are</p>
            <p><strong>Email: </strong>${email}</p>
            <p><strong>Password: </strong>${password}</p>
        	<br/>
        	<p>Have a Nice Day!</p>            
        </div>
        `;

        await sendEmail({ email: email, name: name }, emailBody, "Binamite admin credentials");

        return res.status(200).send({
            msg: "User Added Successfully",
            user: savedUser
        });
    } catch (err) {
        console.log(err);
        return res.status(400).send({ msg: err });
    }
};


const signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        let cookieEmail;
        let cookieRole;

        const user = await Admin.findOne({ email });

        if (!user) {
            return res.status(400).send({
                message: "Invalid credentials."
            })
        }

        const isValid = bcrypt.compareSync(password, user.password)

        if (!isValid) {
            return res.status(400).send({ message: "Invalid credentials." })
        }

        cookieEmail = user.email
        cookieRole = user.role


        const accessToken = jwt.sign(
            { data: { email: cookieEmail, role: cookieRole } },
            process.env.VERIFY_AUTH_TOKEN,
            {
                expiresIn: "30s",
            }
        );
        const refreshToken = jwt.sign(
            { data: { email: cookieEmail, role: cookieRole } },
            process.env.VERIFY_REFRESH_TOKEN,
            {
                expiresIn: "3h",
            }
        );

        res
            .status(202)
            .cookie("accessToken", accessToken, {
                expires: new Date(new Date().getTime() + 30 * 1000),
                httpOnly: true,
                sameSite: "strict",
                domain: '.binamite.com'
            })
            .cookie("authSession", true, {
                expires: new Date(new Date().getTime() + 30 * 1000),
                domain: '.binamite.com'
            })
            .cookie("refreshToken", refreshToken, {
                expires: new Date(new Date().getTime() + 3557600000),
                httpOnly: true,
                sameSite: "strict",
                domain: '.binamite.com'
            })
            .cookie("refreshTokenID", true, {
                expires: new Date(new Date().getTime() + 3557600000),
                domain: '.binamite.com'
            })
            .send({
                msg: "Logged in successfully",
                email: cookieEmail,
                role: cookieRole,
                domain: '.binamite.com'
            });
    } catch (err) {
        res.send({ msg: err });
    }
};


const refresh = (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(403).send({
            msg: "Refresh Token Not Found, Please Login Again",
        });
    }
    try {
        const payload = jwt.verify(refreshToken, process.env.VERIFY_REFRESH_TOKEN);
        const accessToken = jwt.sign(
            { data: { email: payload.data.email, role: payload.data.role } },
            process.env.VERIFY_AUTH_TOKEN,
            {
                expiresIn: "30s",
            }
        );
        res
            .status(202)
            .cookie("accessToken", accessToken, {
                expires: new Date(new Date().getTime() + 30 * 1000),
                sameSite: "strict",
                httpOnly: true,
                domain: '.binamite.com'
            })
            .cookie("authSession", true, {
                expires: new Date(new Date().getTime() + 30 * 1000),
                domain: '.binamite.com'
            })
            .send({ email: payload.data.email, role: payload.data.role });
    } catch (err) {
        res.status(403).send({ msg: err, success: false });
    }
};

module.exports = {
    addUser,
    signin
}