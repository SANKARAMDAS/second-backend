
const checkstatus = async (req, res, next) => {
    const user = req.user
    try {
        if (req.role == "freelancer") {
            if (user.kycStatus === 'Active' || user.kycStatus === 'Pending') {
                return res.status(400).send({ message: "KYC status: " + user.kycStatus });
            }
        } else {
            if (user.kybStatus === 'Active' || user.kybStatus === 'Pending') {
                return res.status(400).send({ message: "KYB status: " + user.kybStatus });
            }
        }
        next()
    } catch (e) {
        return res.status(400).send({ message: e.message })
    }

};

module.exports = { checkstatus };
