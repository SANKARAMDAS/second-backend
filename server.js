const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const cors = require("cors");
const env = require("dotenv").config();
const mongoose = require("mongoose");

const googleLoginRouter = require("./routes/auth/googleLogin");
const invoiceRouter = require("./routes/invoice");
const userRoute = require("./routes/auth/user");
const wyreRoute = require("./routes/wyre/general");
const transferRoute = require("./routes/wyre/transfer");
const paymentRoute = require("./routes/wyre/payment");
const contactRoute = require("./routes/contact")
const transactionRoute = require("./routes/wyre/transaction")
const securityPinRoute = require("./routes/securityPin")
const plaidRoute = require("./routes/plaid")
const twofaRoute = require("./routes/2fa")
const subRoute = require("./routes/subscribe")
const notificationRoute = require("./routes/notification")
const connectionRoute = require("./routes/connections")
const adminRoute = require("./routes/admin/auth")
const adminRoute2 = require("./routes/admin/general")
const reinitiateTransaction = require("./routes/admin/reinitiate")
const kycRoute = require("./routes/admin/kyc");
const payoutAuth = require("./routes/payoutAuth");

const { task } = require("./controllers/emailCronJob");

const app = express();

// Connecting to mongodb
mongoose.connect(
	process.env.DATABASE_URL,
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	},
	(err) => {
		if (!err) {
			console.log("MongoDB Connected");
		} else {
			console.log("Error in connection : " + err);
		}
	}
);

var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function () { });

// Middlewares
var allowedDomains = ['https://binamite.com', 'https://rdx.binamite.com', 'http://localhost:3003', 'https://beta.binamite.com'];
app.use(cors({
	origin: function (origin, callback) {
		if (!origin) return callback(null, true);

		if (allowedDomains.indexOf(origin) === -1) {
			var msg = `This site ${origin} does not have an access. Only specific domains are allowed to access it.`;
			return callback(new Error(msg), false);
		}
		return callback(null, true);
	}, credentials: true
}));
app.use(cookieParser());
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		// cookie: { domain: '.binamite.com' },
		resave: false,
		saveUninitialized: true,
	})
);
// app.use(bodyParser.json({ limit: "100mb" }));
// app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get("/", (req, res) => {
	res.send("Binamite Octaloop API 22.05");
});

//runs every 24 hours
// task.start();

// Base Routes
app.use("/api/auth", userRoute.route);
app.use("/api/google-api", googleLoginRouter.route);
app.use("/api/invoice", invoiceRouter.route);
app.use("/api/wyre-general", wyreRoute);
app.use("/api/wyre-transfer", transferRoute);
app.use("/api/wyre-payment", paymentRoute);
app.use("/api/transactions", transactionRoute);
app.use("/api/contact", contactRoute);
app.use("/api/securityPin", securityPinRoute);
app.use("/api/plaid", plaidRoute)
app.use("/api/2fa", twofaRoute)
app.use("/api/subscribe", subRoute)
app.use("/api/connection", connectionRoute)
app.use("/api/notifications", notificationRoute)
app.use("/api/admin/auth", adminRoute)
app.use("/api/admin", adminRoute2)
app.use("/api/admin/reinitiate", reinitiateTransaction)
app.use("/api/kyc", kycRoute)
app.use("/api/payoutAuth", payoutAuth)

const PORT = process.env.PORT || 4000;
app.listen(PORT, function () {
	console.log("Server Running on PORT " + PORT);
});

module.exports = app;
