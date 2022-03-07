const Freelancer = require("../models/freelancer");
const Business = require("../models/business");
const Invitation = require("../models/invitation")
const { sendEmail } = require("./sendEmail");

const invite = async (req, res) => {
    const { email } = req.body;
    // const user = req.user
    // const role = req.role
    // const connections = user.connections

    try {

        const user = await Freelancer.findOne({ email: "jmcnally2978@gmail.com" })
        const role = "freelancer"
        const connections = user.connections

        if (email === user.email) {
            return res.status(400).send()
        }

        const prevInvitation = await Invitation.findOne({ from: email, to: user.email })
        const prevInvitation2 = await Invitation.findOne({ to: email, from: user.email })

        if (prevInvitation !== null || prevInvitation2 !== null) {
            return res.status(400).send({ message: "previous invitation pending." })
        }

        for (var i = 0; i < connections.length; i++) {
            if (connections[i].email === email) {
                return res.status(400).send({ message: "user is already a connection." })
            }
        }

        if (role === "freelancer") {
            const freelancerFound = await Freelancer.findOne({ email });
            if (freelancerFound !== null) {
                return res.status(400).send({ message: "can not invite users with same role." })
            }
        } else {
            const BusinessFound = await Business.findOne({ email });
            if (BusinessFound !== null) {
                return res.status(400).send({ message: "can not invite users with same role." })
            }
        }

        const newInvitation = new Invitation({
            from: user.email,
            to: email,
        })

        const link = `https://rdx.binamite.com/invitations`;

        const emailBody = `
	<div>
		<p>${user.name} has invited you to connect on Binamite<br>Click on the link to accept the invitation <a href=${link}>Link</a>.</p>
		<br/>
		<p>Have a Nice Day!</p>            
	</div>
	`;

        await sendEmail({ email: email }, emailBody, "Binamite Invitation");
        await newInvitation.save()
        res.status(200).send({ message: "Invitation Sent!" })

    } catch (e) {
        res.status(400).send({ message: e.message })
    }
}

const accept = async (req, res) => {
    const { id } = req.body
    const user = req.user
    const role = req.role

    try {

        // const user = await Business.findOne({ email: "gitanshwadhwa0028@gmail.com" })
        // const role = "business"

        const invitation = await Invitation.findById(id)
        if (invitation == null) {
            return res.status(400).send({ message: "Expired invitation!" })
        }
        const freelancer = await Freelancer.findOne({ email: invitation.from })
        const business = await Business.findOne({ email: invitation.from })

        if ((freelancer !== null && role === 'freelancer') || (business !== null && role === 'business') || (business == null && freelancer == null)) {
            await Invitation.deleteOne({ _id: id })
            return res.status(400).send({ message: "Expired invitation!" })
        }

        if (freelancer !== null) {
            if (freelancer.connections.find(o => o.email === user.email) == null) {
                freelancer.connections.push({ email: user.email })
                user.connections.push({ email: freelancer.email })
                await freelancer.save();
                await user.save()
            }

        } else {
            if (business.connections.find(o => o.email === user.email) == null) {
                business.connections.push({ email: user.email })
                user.connections.push({ email: freelancer.email })
                await business.save()
                await user.save()
            }
        }

        await Invitation.deleteOne({ _id: id })

        res.status(200).send({ message: "invitation accepted" })

    } catch (e) {
        res.status(400).send({ message: e.message })
    }

}

const reject = async (req, res) => {
    const { id } = req.body
    try {
        await Invitation.deleteOne({ _id: id })
        res.status(200).send()
    } catch (e) {
        res.status(400).send()
    }
}

const getInvitations = async (req, res) => {
    const user = req.user
    try {
        const invitations = await Invitation.find({ $or: [{ from: user.email }, { to: user.email }] })
        res.status(200).send(invitations)
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
}

module.exports = {
    invite,
    accept,
    reject,
    getInvitations
}