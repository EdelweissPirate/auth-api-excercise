require('dotenv').config()
const fs = require('fs')
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const rawUsers = fs.readFileSync('./data/users.json')
let users = JSON.parse(rawUsers)

const updateUsersDB = () => {
    fs.writeFileSync(
        './data/users.json', 
        JSON.stringify(users)
    )
}

// returns users in user DB
router.get('/', authenticateToken, (req, res) => {
    res.json(users.filter(user => (user.username === req.user.username)))
})

// adds user to user DB
router.post('/', async (req, res) => {
    try {
        const userExists = users.find(user => user.username === req.body.username)
        if(userExists) return res.status(400).send('User exists.')

        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const user = { username: req.body.username,  password: hashedPassword}
        users.push(user)
        updateUsersDB()
        res.status(201).send(user.username + ' created.')
    } catch(err){
        res.status(500).send('failed to create user.')
    }
})

// deletes user from DB
router.delete('/', (req, res) => {
    // filter out user sent in request
    users = users.filter(user => user.username !== req.body.user.username)

    // write filtered users array to json file
    updateUsersDB()
    res.sendStatus(204)
})

function authenticateToken(req, res, next){
    // gets Bearer token from request
    const authHeader = req.headers['authorization']

    //BEARER TOKEN - split at space and get second array item for token
    const token = authHeader && authHeader.split(' ')[1]
    if(token === null) return res.sendStatus(401)

    // verify passed token against token secret.
    // passes user information FROM THE TOKEN
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err) return res.sendStatus(403)
        // set user as request.user
        req.user = user
        next()
    })
};

module.exports = router;