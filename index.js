const express = require('express')
const {Server} = require('socket.io')
const path = require('path')
const http = require('http')
const { json } = require('express')
const cors=require('cors')
const bcryptjs=require('bcryptjs')
const pool = require('./db')
const app = express()
const server=http.createServer(app)

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({extended:true}))
app.use(json())
app.use(cors())

const PORT = process.env.PORT || 3000

//Go to login page
app.get('/', (req,res)=>{
    console.log('hello')
    res.sendFile(path.join(__dirname,'public/login.html'))
})
//socket
app.get('/socket', (req,res)=>{
    var {name}=req.query
    console.log('query: '+name)
    res.sendFile(path.join(__dirname,'public/socket.html'))
    })
//name

//sign in
app.post('/signup', async(req,res)=>{
    const {signupName, signupPassword} = req.body
    const hashedpassword=await bcryptjs.hash(signupPassword,10) 
    await pool.query('INSERT INTO users (name,password) VALUES($1,$2)',[signupName,hashedpassword])
    res.redirect(`/socket?name=`+signupName)
    console.log(`${signupName} signed up!`)
    
})

//Login
app.post('/login',async(req,res)=>{
    const {loginName, loginPassword}=req.body
    const userZero = await pool.query('SELECT * FROM users WHERE name=$1',[loginName])
    const user = userZero.rows[0]
        console.log(user)
    try{
        if(user) 
        {
        bcryptjs.compare(loginPassword,user.password, (err,result)=>{
            if(err){
                console.error('error')
                res.redirect('/')

                
            }else if(result){
                res.redirect(`/socket?name=`+loginName)
                console.log(`${loginName} logged in!`)                            
            }else{
                console.log('wrong password')
                res.redirect('/')
            }
        })
    }else{
        console.log('user not found')
    }
    }catch(err){
        console.error(err)
        alert('something went wrong')
    }
    
})
server.listen(PORT, ()=>{
    console.log(`listening on port ${PORT}`)
})
//log out
app.get('/logout',(req,res)=>{
    res.redirect('/')
    console.log('Logged off')
})

const ADMIN = 'Admin'

//state
const UsersState = {
    users:[],
    setUsers: function(newUsersArray){
        this.users = newUsersArray
    }
}

const io = new Server(server)

io.on('connection', socket=>{
    console.log(`User ${socket.id} connected`)

    //Upon connection-only to user
    socket.emit('message', buildMsg(ADMIN, 'Welcome to Chat App!'))

    socket.on('enterRoom', ({name, room})=>{
    //Leave previous room
 
 const prevRoom = getUser(socket.id).room
 if(prevRoom){
    socket.leave(prevRoom)
    io.to(prevRoom).emit('message', buildMsg(ADMIN, `${name} has left the room`))
 }
 const user = activateUser(socket.id, name, room)

 //Cannot update previous room users list until after the state update in activate user
 if(prevRoom){
    io.to(prevRoom).emit('userList', {
        users:getUsersInRoom(prevRoom)
    })
 }

 //join room
 socket.join(user.room)

 //To user who joined
 socket.emit('message', buildMsg(ADMIN, `You have joined ${user.room} chat room`))

 //To everyone else
 socket.broadcast.emit('message', buildMsg(ADMIN, `${user.name} has joined the room`))

 //Update user list for room
 io.to(user.room).emit('userList',{
    users:getUsersInRoom(user.room)
 })

 //Update room list for everyone
 io.emit('roomlist',{
    rooms:getAllActiveRooms()
 })

 })


 //When user disconnects - to all others
 socket.on('disconnect', ()=>{
    const user = getUser(socket.id)
    userLeavesApp(socket.id)
    if(user){
        io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left the room`))
        io.to(user.room).emit('userList', {
            users:getUsersInRoom(user.room)
        })
        io.emit('roomList', {
            room:getAllActiveRooms()
        })
    }
    console.log(`User ${socket.id} disconnected`)
    })

    
    //Upon connection-to all others
    socket.broadcast.emit(`User ${socket.id.substring(0,5)} connected`)

    //Listening for a message event
    socket.on('message', ({name, text})=>{
        const room = getUser(socket.id).room
        if(room){
            io.to(room).emit('message', buildMsg(name, text))
        }
        })

   
    //Listen for activity
    socket.on('activity', (name)=>{
        const room = getUser(socket.id).room
        if(room){
            socket.broadcast.to(room).emit('activity', name)
        }
        })
})

function buildMsg(name, text){
    return{
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute:'numeric',
            second:'numeric'
        }).format(new Date())
    }
}

//User functions
function activateUser(id, name, room){
    const user = {id, name, room}
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id),
        user
    ])
    return user
}

function userLeavesApp(id){
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id)
    ])
}

function getUser(id){
   if( UsersState.users.find(user=>user.id === id)){
    return UsersState.users.find(user=>user.id === id)
   }else{
    return []
   }
}

function getUsersInRoom(room){
    return UsersState.users.filter(user=>user.room === room)
}

function getAllActiveRooms(){
    return Array.from(new Set(UsersState.users.map(user=>user.room)))
}
