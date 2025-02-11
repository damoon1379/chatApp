var socket = io('ws://localhost:3000')
const msgInput = document.getElementById('message')
const nameInput = document.getElementById('name')
const chatRoom=document.getElementById('room')
const activity = document.querySelector('.activity')
const usersList = document.querySelector('.user-list')
const roomList = document.querySelector('.room-list')
const chatDisplay = document.getElementById('chat-display')

//getting name from query
const params=new URLSearchParams(window.location.search)
const names=params.get("name")
console.log("query is : "+names)

nameInput.value=names

function sendMessage(e){
    e.preventDefault()
    if(nameInput.value && msgInput.value && chatRoom.value ){
        socket.emit('message', {
             name :nameInput.value,
             text :msgInput.value
        })
        msgInput.value=''
    }
    msgInput.focus()
}

function enterRoom(e){
    e.preventDefault()
    console.log('join clicked')

    if(nameInput.value && chatRoom.value){
        socket.emit('enterRoom', {
             name : nameInput.value,
             room : chatRoom.value
        })
    }
}

document.querySelector('.form-msg').addEventListener('submit', sendMessage)
document.getElementById('form-join').addEventListener('submit', enterRoom)
msgInput.addEventListener('keypress', ()=>{
    socket.emit('activity', nameInput.value)
})
socket.on('message', (data)=>{
    activity.textContent=''
    const{name, text, time}=data
    const li = document.createElement('div')
    li.className='post'
    if(name===nameInput.value) {li.className='post post--left'}
    if(name!== nameInput.value&&name!=='Admin') {li.className='post post--right'}
    if(name!=='Admin') {
        li.innerHTML = `<div class ="post__header ${name === nameInput.value 
            ? 'post__header--user'
            :'post__header--reply'
                                                   }">
    <span class ="post__header--name">${name}</span>
    <span class ="post__header--time">${time}</span>
   
    <div class="post__text ${name === nameInput.value 
    ? 'post__text--user'
    : 'post__text--reply'}">${text}</div>
    </div>
    `
    } else{
        li.innerHTML=`<div class="post__text">${text}</div>`
    }
    chatDisplay.appendChild(li)
    chatDisplay.scrollTop= chatDisplay.scrollHeight   //********* */
})

let activityTimer
socket.on('activity', (name)=>{
    activity.textContent=`${name} is typing...`

    //Clear after 3 seconds
    clearTimeout(activityTimer)
    activityTimer= setTimeout(()=>{
        activity.textContent=''
    },3000)
})

socket.on('userList', ({users})=>{
    showUsers(users)
})

socket.on('roomList', ({rooms})=>{
    showRooms(rooms)
})

function showUsers(users){
    usersList.textContent=''
    if(users){
        usersList.innerHTML=`<em>Users in ${chatRoom.value}:
        </em>`
        users.forEach((user, i)=>{
            usersList.textContent+=`${user.name}`
            if(users.length>1 && i !== users.length-1){
                usersList.textContent+=','
            }
        })
    }
}

function showRooms(rooms){
    roomList.textContent=''
    if(rooms){
        roomList.innerHTML=`<em>Active rooms:
        </em>`
        rooms.forEach((room, i)=>{
            roomList.textContent+=`${room}`
            if(rooms.length>1 && i !== rooms.length-1){
                roomList.textContent+=','
            }
        })
    }
}