const Mailchimp = require("mailchimp-api-v3")
const mc_api_key = process.env.MAILCHIMP_API_KEY
const list_id = process.env.LIST_ID
const mailchimp = new Mailchimp(mc_api_key)

const createList = async (req, res) => {

    try {

        const response = await mailchimp.post(`/lists`, {
            name: "test",
            permission_reminder: "some text",
            email_type_option: true,
            contact: {
                company: "company",
                address1: "address1",
                city: "city",
                country: "country",
            },
            campaign_defaults: {
                from_name: "gitansh",
                from_email: "gitansh@octaloop.com",
                subject: "some subject",
                language: "English",
            },
        });

        console.log(
            `Successfully created an audience. The audience id is ${response.id}.`
        );
        res.status(200).send(response)

    } catch (e) {
        console.log(e);
        res.status(400).send(e)
    }
}

const addMember = async (req, res) => {

    const email = req.body.email
    mailchimp.post(`/lists/${list_id}/members/`, {
        email_address: email,
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
    addMember,
    createList
};