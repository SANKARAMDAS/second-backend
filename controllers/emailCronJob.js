const Freelancer = require("../models/freelancer");
const Business = require("../models/business");
const Invitation = require("../models/invitation")
const { sendEmail } = require("./sendEmail");
var cron = require('node-cron');

var task = cron.schedule('* */24 * * * *', async () => {
    try {
        const users = await Freelancer.find({ status: "Pending" })
        console.log(users.length)
        for (const user of users) {

            const timeCreated = Math.floor((new Date().valueOf() - user._id.getTimestamp().valueOf()) / 1000)

            if (timeCreated >= '86400' && timeCreated < '172800' && !user.verificationReminderSent) {

                const link = `https://rdx.binamite.com/confirm/${user.confirmationCode}`;

                const emailBody = `
	<div>
		<p style="font-weight: bold;" >Hello ${user.name},</p>
		<p>We just need to verify your email address before you can continue using Binamite. <br>Click on the Link to verify your email address: <a href=${link}>Link</a></p>
		<p>If you have not registered on the website, kindly ignore the email</p>
		<br/>
		<p>Have a Nice Day!</p>            
	</div>
	`;

                await sendEmail({ email: user.email, name: user.name }, emailBody, "Email Verification Reminder");
                user.verificationReminderSent = true
                await user.save()

            } else if (timeCreated > '259200') {
                await Freelancer.deleteOne({ _id: user._id })
                await Business.deleteOne({ _id: user._id })
            }

        }
    } catch (e) {
        console.log("There was an error.");
    }
}, {
    scheduled: false
});

module.exports = { task }