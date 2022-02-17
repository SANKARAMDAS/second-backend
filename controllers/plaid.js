const { Configuration, PlaidApi, PlaidEnvironments, Products } = require('plaid');
const { wyre } = require("./wyre/boilerplate")
const Transaction = require("../models/freelancer");
const Business = require("../models/business");

const config = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
            'PLAID-SECRET': process.env.PLAID_SECRET,
        },
    }
});

const plaidClient = new PlaidApi(config);

const createLinkToken = async (req, res) => {
    try {
        const tokenResponse = await plaidClient.linkTokenCreate({
            user: {
                client_user_id: 'Gitansh292',
            },
            client_name: 'Binamite',
            products: [Products.Auth, Products.Identity],
            country_codes: ['US'],
            language: 'en',
            // webhook: 'https://webhook.site/0125021f',
            redirect_uri: 'https://127.0.0.1:5500/index.html',
        });
        console.log(tokenResponse)
        res.status(200).send(tokenResponse.data);
    } catch (err) {
        console.log(err)
        return res.status(400).send();
    }
};

const exchangePublicToken = async (req, res) => {

    const { public_token, account } = req.body
    //const user = req.user

    try {
        const exchangeTokenResponse = await plaidClient.itemPublicTokenExchange({ public_token });
        const access_token = exchangeTokenResponse.data.access_token;

        // Create a processor token for a specific account id.
        let processorTokenResponse = await plaidClient.processorTokenCreate({
            access_token,
            account_id: account,
            processor: 'wyre'
        });

        let plaidProcessorToken = processorTokenResponse.data.processor_token;

        const paymentMethodResult = await wyre.post('/v2/paymentMethods', {
            plaidProcessorToken,
            paymentMethodType: 'LOCAL_TRANSFER',
            country: 'US'
        })
        console.log(paymentMethodResult)
        // await user.paymentMethods.push({ paymentMethodId: paymentMethodResult.id })
        // await user.save();
        res.status(200).send(paymentMethodResult);
    } catch (err) {
        console.log(err)
        return res.status(400).send(err);
    }
};

module.exports = {
    createLinkToken,
    exchangePublicToken
}