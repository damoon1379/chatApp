const loginForm = document.getElementById('loginForm')
const loginBtn=document.getElementById('loginBtn')

/*loginForm.addEventListener('submit',async()=>{
    const loginName=document.getElementById('loginName').value
    const loginPassword=document.getElementById('loginPassword').value
    console.log(loginName)
     const response = await fetch('http://localhost:3000/login',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({loginName,loginPassword})
    })
    if(response.ok){
        window.location.href='./socket.html'
    }

})*/