const sgMail = require("@sendgrid/mail");

const sendEmail = async (data, emailBody, subject) => {
	sgMail.setApiKey(process.env.EMAIL_API_KEY);

	let messageUser = {
		to: data.email,
		from: {
			name: "Polaris",
			email: "octalooppolaristest@gmail.com", // senders email as registered with sendgrid
		},
		subject: subject,
		html: emailBody,
	};

	if (data.attachment) {
		messageUser = {
			...messageUser,
			attachment: [
				{
					filename: data.attachment.fileName,
					content: data.attachment.pdfFile,
					type: "application/pdf",
					disposition: "attachment",
					contentId: "myId",
				},
			],
		};
	}

	// Client message

	await sgMail.send(messageUser).then((response) => {
		console.log(response[0].statusCode);
	});
	return;
};

module.exports = {
	sendEmail,
};
