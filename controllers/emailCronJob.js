const Freelancer = require("../models/freelancer");
const Business = require("../models/business");
const { sendEmail } = require("./sendEmail");
var cron = require('node-cron');

// verification reminder
var task = cron.schedule('* */24 * * *', async () => {
    try {
        const users = await Freelancer.find({ status: "Pending" })
        console.log(users.length)
        for (const user of users) {

            const timeCreated = Math.floor((new Date().valueOf() - user._id.getTimestamp().valueOf()) / 1000)

            if (timeCreated >= '86400' && timeCreated < '172800' && !user.verificationReminderSent) {

                const link = `https://rdx.binamite.com/confirm/${user.confirmationCode}`;

                const emailBody = `
	<div>
		<p style="font-weight: bold;" >Hey ${user.name}!</p>
		<p>We noticed that you haven't yet verified your email address for your Binamite account. Clicking on the verification link below will finish creating your account and allow you to login and start collaborating with other members of our community.</p>
        <a href=${link}>Link</a>
        <p>
		If you have any questions or need assistance along the way, please do not hesitate to reach out to our support team at team@binamite.com
        </p>
        <p>
		Thanks for choosing Binamite as your go-to space for collaboration and inspiration!
		</p>                
	</div>
	`;

                await sendEmail({ email: user.email, name: user.name }, emailBody, "You’re Almost There!");
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