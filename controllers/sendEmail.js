var helper = require("sendgrid").mail;
var sg = require("sendgrid")(process.env.EMAIL_API_KEY);
var fs = require("fs");

const sendEmail = async (data, emailBody, subject) => {
	var mail = new helper.Mail();
	var email = new helper.Email("octalooppolaristest@gmail.com", "Binamite");
	mail.setFrom(email);

	mail.setSubject(subject);

	var personalization = new helper.Personalization();
	email = new helper.Email(data.email, "User");
	personalization.addTo(email);
	mail.addPersonalization(personalization);

	var content = new helper.Content("text/html", emailBody);
	mail.addContent(content);

	if (data.attachment) {
		var attachment = new helper.Attachment();
		attachment.setContent(data.attachment.pdfFile);
		attachment.setType("application/pdf");
		attachment.setFilename("my_file.pdf");
		attachment.setDisposition("attachment");
		mail.addAttachment(attachment);
	}

	var request = sg.emptyRequest({
		method: "POST",
		path: "/v3/mail/send",
		body: mail.toJSON(),
	});

	sg.API(request, function (err, response) {
		console.log(response.statusCode);
		// console.log(response.body);
		// console.log(response.headers);
	});
};

// const sgMail = require("@sendgrid/mail");
// const fs = require("fs");

// const sendEmail = async (data, emailBody, subject) => {
// 	sgMail.setApiKey(process.env.EMAIL_API_KEY);

// 	let messageUser = {
// 		to: data.email,
// 		from: {
// 			name: "Polaris",
// 			email: "octalooppolaristest@gmail.com", // senders email as registered with sendgrid
// 		},
// 		subject: subject,
// 		html: emailBody,
// 	};

// 	if (data.attachment.flag === true) {
// 		messageUser = {
// 			...messageUser,
// 			attachment: [
// 				{
// 					filename: `Invoice ${data.invoiceId}`,
// 					// content: data.attachment.pdfFile,
// 					content: data.attachment.pdfFile,
// 					type: "application/pdf",
// 					disposition: "attachment",
// 					method: "REQUEST",
// 				},
// 			],
// 		};
// 	}

// 	// Client message

// 	await sgMail.send(messageUser).then((response) => {
// 		console.log(response[0].statusCode);
// 	});
// 	return;
// };

module.exports = {
	sendEmail,
};
