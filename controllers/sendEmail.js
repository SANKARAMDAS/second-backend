const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");

const sendEmail = async (data, emailBody, emailSubject) => {
	const { email } = data;
	const name = "Polaris";
	//console.log(email, emailBody, subject);

	var transporter = nodemailer.createTransport(
		smtpTransport({
			host: "smtp.gmail.com",
			port: 465,
			secure: true, // use SSL
			auth: {
				user: "octalooppolaristest@gmail.com",
				pass: process.env.PASS,
			},
			tls: {
				rejectUnauthorized: false,
			},
		})
	);

	// setup e-mail data
	var mailOptions = {
		from: `${name} <octalooppolaristest@gmail.com>`, // sender address (who sends)
		to: email, // list of receivers (who receives)
		subject: `${emailSubject}`, // Subject line
		html: emailBody, // html body
	};

	// send mail with defined transport object
	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			return console.log(error);
		}
		console.log("Message sent: " + info.response);
	});

	return;
};

module.exports = {
	sendEmail,
};
