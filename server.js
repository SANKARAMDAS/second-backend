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
const wyreRoute = require("./routes/wyre/general")
const transferRoute = require("./routes/wyre/transfer")

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
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: true,
	})
);
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
	res.send("Working!");
});

// Base Routes
app.use("/api/auth", userRoute.route);
app.use("/api/google-api", googleLoginRouter.route);
app.use("/api/invoice", invoiceRouter.route);
app.use("/api/wyre-general", wyreRoute)
app.use("/api/wyre-transfer", transferRoute)

const PORT = process.env.PORT || 4000;
app.listen(PORT, function () {
	console.log("Server Running on PORT " + PORT);
});

module.exports = app;
