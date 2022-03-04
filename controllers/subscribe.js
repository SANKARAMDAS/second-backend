const Mailchimp = require("mailchimp-api-v3")
const mc_api_key = process.env.MAILCHIMP_API_KEY
const list_id = process.env.LIST_ID
const mailchimp = new Mailchimp(mc_api_key)

const addMember = async (req, res) => {
    const { email, fullName } = req.body
    mailchimp.post(`/lists/${list_id}/members/`, {
        email_address: email,
        merge_fields: {
            FNAME: fullName
        },
        status: "pending",
    }).then((result) => {
        res.send({
            result,
            msg: "SUCCESS"
        });
    }).catch((err) => {
        res.send({
            err,
            msg: "FAIL"
        });
    })
};


module.exports = {
    addMember
};