const Business = require("../../models/business");
const Freelancer = require("../../models/freelancer");
const { sendEmail } = require("../sendEmail");
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const getUser = async (req, res) => {
    const { id } = req.body
    try {
        let user
        user = await Freelancer.findById(id)
        if (!user) user = await Business.findById(id)

        if (!user) return res.status(404).send({ message: "user not found." })

        res.status(200).send({ data: user })


    } catch (e) {

        res.send({ message: e.message })

    }
}

const getDocument = async (req, res) => {

    const { id } = req.body

    let user
    user = await Freelancer.findById(id)
    if (!user) user = await Business.findById(id)
    if (!user.document) {
        return res.status(404).send({ message: "Document not Found." })
    }

    const filePath = __dirname + "/../../public/uploads/" + user.document

    fs.exists(filePath, exists => {

        if (!exists) {
            return res.status(404).send({ message: "Document not Found." })
        }

        return res.status(200).sendFile(path.resolve(filePath))
    });

}

const accept = async (req, res) => {
    const { id } = req.body
    try {
        let user
        user = await Freelancer.findById(id)
        if (!user) user = await Business.findById(id)

        if (!user) return res.status(404).send({ message: "user not found." })

        user.kycStatus = 'Active'
        await user.save()

        res.status(200).send({ data: user })

    } catch (e) {

        res.send({ message: e.message })

    }
}

const reject = async (req, res) => {
    const { id } = req.body
    try {
        let user
        user = await Freelancer.findById(id)
        if (!user) user = await Business.findById(id)

        if (!user) return res.status(404).send({ message: "user not found." })

        user.kycStatus = 'Incomplete'
        await user.save()

        const emailBody = `
	<div>
		<p style="font-weight: bold;" >Hello ${user.name},</p>
		<p>You need to upload the verification documents again to access all Binamite features.</p>
		<br/>
		<p>Have a Nice Day!</p>            
	</div>
	`;

        await sendEmail({ email: user.email, name: user.name }, emailBody, "KYC Verification");

        res.status(200).send({ data: user })

    } catch (e) {

        res.send({ message: e.message })

    }
}

module.exports = {
    getUser, accept, reject, getDocument
}