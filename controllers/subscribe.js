const Mailchimp = require("mailchimp-api-v3")
const mc_api_key = process.env.MAILCHIMP_API_KEY
const list_id = process.env.LIST_ID
const mailchimp = new Mailchimp(mc_api_key)

const addMember = async (req, res) => {
    const { email, fname, lname } = req.body
    try {
        const result = await mailchimp.post(`/lists/${list_id}/members/`, {
            email_address: email,
            merge_fields: {
                FNAME: fname,
                LNAME: lname
            },
            status: "pending",
        })
        const response = await mailchimp.post(`/lists/${list_id}/members/${result.id}/tags/`,
            {
                tags: [{ name: "Binamite", status: "active" }]
            }
        );
        res.status(200).send(response)
    } catch (e) {
        res.status(400).send({ message: e.message })
    }
};


module.exports = {
    addMember
};