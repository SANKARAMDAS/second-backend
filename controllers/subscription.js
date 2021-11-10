const Mailchimp = require("mailchimp-api-v3")
require("dotenv").config()
const mc_api_key = process.env.MAILCHIMP_API_KEY
const list_id = process.env.LIST_ID

const mailchimp = new Mailchimp(mc_api_key)

const addMember = async (req, res) => {

    const email = req.body.email
    const FNAME = req.body.FNAME
    const LNAME = req.body.LNAME
    const BIRTHDAY = req.body.BIRTHDAY
    const addr1 = req.body.addr1
    const city = req.body.city
    const state = req.body.state
    const zip = req.body.zip
    const PHONE = req.body.PHONE
    const country = req.body.country


    mailchimp.post(`/lists/${list_id}/members/`, {
        email_address: email,
        status: "subscribed",
        merge_fields: {
            FNAME,
            LNAME,
            BIRTHDAY,
            PHONE,
            ADDRESS: {
                addr1,
                city,
                country,
                state,
                zip,
            },
        },
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