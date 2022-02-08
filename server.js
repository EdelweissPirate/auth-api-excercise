require('dotenv').config()
const express = require('express')
const axios = require('axios')
const usersRouter = require('./routes/users')
const kupoRouter = require('./routes/kupo')

const PORT = 3000

const app = express()
app.use(express.json())

app.use('/users', usersRouter)
app.use('/kupo', kupoRouter)


// FUNCTION TESTS FOR FRONT END
// adds user to user DB
const tony =  { username: 'tony', password: 'moon'}

async function createUser(user){
    user = { username: user.username.toLowerCase(), password: user.password }

    const res = await axios.post('http://localhost:3000/users', user)
        .then(() => console.log(`${user.username} added!`))
        .catch(err => console.log('to err is human.', err))
    
    return res
};

// removes user from DB
async function removeUser(user){
    const res = await axios.delete('http://localhost:3000/users', { data: { user }})
    .then(response => console.log(`${user.username} removed!`))
        .catch(err => console.log('to err is human.', err))
    
        return res
};

const TEST = () => {
    setTimeout(function(){
        createUser(tony)
        setTimeout(function(){
            removeUser(tony)
        }, 5000)
    }, 3000)
}

TEST()

app.listen(PORT, console.log(`Server active at localhost:${PORT}`))
