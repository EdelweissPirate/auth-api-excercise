require('dotenv').config()
const fs = require('fs')
const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const PORT_AUTH = 4000

const app = express()
app.use(express.json())

// get refresh tokens from database and parse into javascript 
const rawRefreshTokens = fs.readFileSync('./data/refreshTokens.json')
let refreshTokens = JSON.parse(rawRefreshTokens)

// writes refreshTokens array to refreshtokens.json as JSON
const updateRefreshTokensDB = () => {
    fs.writeFileSync(
        './data/refreshTokens.json', 
        JSON.stringify(refreshTokens)
    )
}

// receives refresh token and outputs new access token
app.post('/token', (req, res) => {
    // get refresh token from request
    const refreshToken = req.body.token

    // if no token return 401 status
    if(refreshToken === null) return res.sendStatus(401)
    
    // if refresh token does not exist in databse return forbidden status
    if(!refreshTokens.includes(refreshToken)) return res.sendStatus(403)

    // verify request token against stored token secret. if error return forbidden
    // else generate new access token and send it in json response
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if(err) return res.sendStatus(403)
        const accessToken = generateAccessToken({ name: user.name, password: user.password })
        res.json({ accessToken: accessToken })
    })
})

app.delete('/logout', (req, res) => {
    // filter out token sent in request
    refreshTokens = refreshTokens.filter(token => token !== req.body.token)

    // write filtered refresh token array to json file
    updateRefreshTokensDB()
    
    res.sendStatus(204)
})

app.post('/login', async (req, res) => {
    const rawUsers = fs.readFileSync('./data/users.json')
    const users = JSON.parse(rawUsers)

    // check if user exists
    const user = users.find(user => user.username === req.body.username)
    console.log(user)
    if(!user){
        return res.status(400).send('User does not exist.')
    }

    try {
        // check if password matches hashed password
        if(await bcrypt.compare(req.body.password, user.password)){
            // if matches generate tokens
            const accessToken = generateAccessToken(user)
            const refreshToken =  generateRefreshToken(user)
            // returns tokens in response 
            res.json({ accessToken: accessToken, refreshToken: refreshToken })
        } else {
            res.status(403).send('Password incorrect.')
        }
    } catch(err){
        res.send(500).send()
    }
})

// jwt.sign() creates new jsonwebtoken
function generateAccessToken(user){
    // secret is stored in .env file (secure?)
    // access token expires in 1 hour from generation
    // then need to use refresh token to get new access token
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
};

function generateRefreshToken(user){
    // creates refresh token
    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
    
    // adds to refresh token array
    refreshTokens.push(refreshToken)
    
    // writes refresh token array to json file
    updateRefreshTokensDB()

    return refreshToken
};

app.listen(PORT_AUTH, console.log(`Server active at localhost:${PORT_AUTH}`))
