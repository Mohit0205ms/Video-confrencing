const start = document.getElementById('start');

const roomId = document.getElementById('roomId');

const userName = document.getElementById('userName');

start.addEventListener('click',()=>{

    window.location.href=`${roomId.value}/${userName.value}`;

});
