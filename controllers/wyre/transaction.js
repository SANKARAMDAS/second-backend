const { wyre } = require("./boilerplate")
const Transaction = require("../../models/transaction")

//get user's transaction history
const getTransactionHistory = async (req, res) => {

    const user = req.user
    let result
    try {
        result = await Transaction.find({ $or: [{ sender: user.email }, { receiver: user.email }] })
        for (var i = 0; i < result.length; i++) {
            if (result[i].status == "EXPIRED" || result[i].status == "FAILED" || result[i].status == "COMPLETED") {
                continue
            }
            const transferResult = await wyre.get(`/transfers/${result[i].transferId}`)
            result[i].status = transferResult.status
            await Freelancer.findOneAndUpdate(
                { transferId: result[i].transferId },
                { status: transferResult.status }
            );
        }
        res.status(200).send(result)
    } catch (e) {
        res.status(400).send(e)
    }
}


module.exports = {
    getTransactionHistory
}