const Contact = require("../models/contact");

const postContact = async (req, res) => {
    let { firstName, middleName, lastName, email, questions } = req.body;

    if (!middleName) {
        middleName = null;
    }
    try {
        const contact = new Contact({ firstName, middleName, lastName, email, questions })
        await contact.save()
        res.status(200).send({ status: "success" })
    } catch (error) {
        res.status(400).send({ status: "failure" });
    }
}

module.exports = {
    postContact
}