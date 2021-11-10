const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt')

const User = require('../models/user');
let err;

router.post('/signup', async (req, res) => {
    const { name, email, password, password2, role } = req.body;

    console.log(req.body.name)

    if (!name || !email || !password || !password2) {
        err = 'Please enter all fields'
        return res.status(400).send(err)
    }

    if (password != password2) {
        err = 'Passwords do not match'
        return res.status(400).send(err)
    }

    if (password.length < 3) {
        err = 'Password must be at least 3 characters'
        return res.status(400).send(err)
    }

    const userExists = await User.findOne({ email: req.body.email });
    if (userExists) {
        err = 'Email already exists'
        return res.status(400).send(err)
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
        name, email, password: hashPassword, role
    })

    try {
        const savedUser = await user.save();
        const token = await user.generateAuthToken()
        req.session.token = token;
        return res.status(200).send(savedUser)
    } catch (err) {
        console.log(err)
        return res.status(400).send(err)
    }
});

router.post('/signin', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        req.session.token = token;
        res.send(user)
    } catch (e) {
        res.status(400).send(e.message)
    }
})

module.exports = router;