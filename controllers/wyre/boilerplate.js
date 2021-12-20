const WyreClient = require('@wyre/api').WyreClient

let wyre = new WyreClient({
    format: "json_numberstring",
    apiKey: process.env.WYRE_API_KEY,
    secretKey: process.env.WYRE_SECRET_KEY,
    baseUrl: process.env.WYRE_BASE_URL
});

module.exports = { wyre }