const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

const sendEmail = async (req, res) => {
	const { email } = req.body;
	const name = "Polaris";

	var transporter = nodemailer.createTransport(
		smtpTransport({
			host: "smtp.gmail.com",
			port: 465,
			secure: true, // use SSL
			auth: {
				user: "polaristestemail@gmail.com",
				pass: process.env.PASS,
			},
			tls: {
				rejectUnauthorized: false,
			},
		})
	);

	// setup e-mail data
	var mailOptions = {
		from: `${name} <rapidquote2021@gmail.com>`, // sender address (who sends)
		to: email, // list of receivers (who receives)
		subject: "test", // Subject line
		html: "<b>Hey!</b><br> This is a test email", // html body
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			return console.log(error);
		}

		console.log("Message sent: " + info.response);
	});
};

module.exports = {
	sendEmail,
};
