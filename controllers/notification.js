
const Invitation = require("../models/invitation")
const Transaction = require("../models/transaction")
const Invoice = require("../models/invoice")
const Freelancer = require("../models/freelancer")


const getNotifications = async (req, res) => {
    const user = req.user
    try {
        const invitations = await Invitation.find({ to: user.email }).sort({ _id: -1 }).limit(10);
        const transactions = await Transaction.find({ receiver: user.email }).sort({ _id: -1 }).limit(10);
        const invoices = await Invoice.find({ businessEmail: user.email }).sort({ _id: -1 }).limit(10);

        const notifications = []

        invitations.forEach(inv => {
            notifications.push({
                timestamp: inv._id.getTimestamp(),
                notificationText: `${inv.from} has invited you to connect.`
            })
        });

        transactions.forEach(tr => {
            notifications.push({
                timestamp: tr._id.getTimestamp(),
                notificationText: `Update on invoice status from ${tr.sender} - ${tr.status}.`
            })
        });

        invoices.forEach(invoice => {
            notifications.push({
                timestamp: invoice._id.getTimestamp(),
                notificationText: `Contractor created an invoice - ${invoice.freelancerEmail}.`
            })
        });

        notifications.sort((a, b) => {
            return b.timestamp - a.timestamp;
        })

        res.status(200).send({ notifications })

    } catch (e) {
        res.status(400).send({ message: e.message })
    }
}

module.exports = {
    getNotifications
}