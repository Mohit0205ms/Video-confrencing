const socket = io("/");

const videoGrid = document.getElementById("video-grid");

const myVideo = document.createElement("video");

const addMessage = document.getElementById('addMessage');

const DisplayChat = document.getElementById("displayMessage");

const participants = document.getElementById("displayParticipants");

myVideo.muted = true;

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
});

let myVideoStream;

var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {

    myVideoStream = stream;

    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {

      call.answer(stream);

      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {

        addVideoStream(video, userVideoStream);

      });

    });

    socket.on("user-connected", (userId) => {

      connectToNewUser(userId, stream); // passing our stream to the new user

    })

    socket.on("addOldUsers", (users) => { // adding old users that are in room

      console.log("Old users length: " + users.length);

      const list=participants.getElementsByTagName("li");

      for (let i = 0; i < users.length; i++) {

        const data=users[i];

        for(let j=0;j<list.length;j++){

          if(list[j].innerHTML === data){

            list[j].remove();

            break;

          }

        }

        const li = document.createElement('li');

        li.append(data);

        li.style.listStyle = "none";

        participants.appendChild(li);
      }
    })

    // when keydown calling message function
    document.addEventListener('keydown', (e) => {

      if (e.key === 'Enter' && addMessage.value != "") {

        socket.emit("message", addMessage.value, USER_NAME);

        addMessage.value = "";

      }

    });

    // displaying message to chat section
    socket.on("createMessage", (msg) => {

      console.log(msg.text);

      console.log(msg.userName);

      const li = document.createElement('li');

      li.append(`${msg.userName}:- ${msg.text}`);

      li.style.listStyle = "none";

      DisplayChat.appendChild(li);

    });


    // when user join room ---> display it on participant section
    socket.on("appendUser", (users) => {

      console.log("Printing the username from script.js : " + users);// printing username on console

      const li = document.createElement('li');

      li.append(users);

      li.style.listStyle = "none";

      participants.appendChild(li);

    })

  });

// making peer connection
peer.on("call", function (call) {

  getUserMedia(
    { video: true, audio: true },
    function (stream) {

      call.answer(stream); // Answer the call with an A/V stream.

      const video = document.createElement("video");

      call.on("stream", function (remoteStream) {

        addVideoStream(video, remoteStream);

      });
    },
    function (err) {

      console.log("Failed to get local stream", err);

    }

  );

});

peer.on("open", (id) => {

  socket.emit("join-room", ROOM_ID, id, USER_NAME);

});

// accepting the stream, Id and displaying to the user
const connectToNewUser = (userId, streams) => {

  var call = peer.call(userId, streams);

  console.log(call);

  var video = document.createElement("video");

  call.on("stream", (userVideoStream) => {

    console.log(userVideoStream);

    addVideoStream(video, userVideoStream); // adding new User video stream 

  });

};

// adding video stream to the window
const addVideoStream = (videoEl, stream) => {

  videoEl.srcObject = stream;

  videoEl.addEventListener("loadedmetadata", () => {

    videoEl.play();

  });

  videoGrid.append(videoEl);

  let totalUsers = document.getElementsByTagName("video").length;

  if (totalUsers > 1) {

    for (let index = 0; index < totalUsers; index++) {

      document.getElementsByTagName("video")[index].style.width = 100 / totalUsers + "%";

    }

  }

};

// function of playing and stoping the video
const videoPlayStop = () => {

  const enable = myVideoStream.getVideoTracks()[0].enabled;

  if (enable) {

    myVideoStream.getVideoTracks()[0].enabled = false;

    stopVideoPlay();

  }

  else {

    myVideoStream.getVideoTracks()[0].enabled = true;

    setVideoPlay();

  }

}

const setVideoPlay = () => {

  const html = `<i class=" fa fa-video-camera"></i><span class="">Pause</span>`;

  document.getElementById('playPauseVideo').innerHTML = html;

}

const stopVideoPlay = () => {

  const html = `<i class="unmute fa fa-pause-circle"></i><span class="unmute">Resume Video</span>`;

  document.getElementById('playPauseVideo').innerHTML = html;

}

// function of mute mic or unmute mic
const MuteUnmute = () => {

  const enable = myVideoStream.getAudioTracks()[0].enable;

  if (enable) {

    myVideoStream.getAudioTracks()[0].enable = false;

    Mute();

  }

  else {

    myVideoStream.getAudioTracks()[0].enable = true;

    unMute();

  }

}
const unMute = () => {

  const html = `<i class="unmute fa fa-microphone-slash"></i> <span class="unmute">Unmute</span>`;

  document.getElementById('muteVoice').innerHTML = html;

}

const Mute = () => {

  const html = `<i class="fa fa-microphone"></i><span id="Mute">Mute</span>`;

  document.getElementById('muteVoice').innerHTML = html;

};

// function of recording the screen
var enable = true;

const RecordedChunks = [];

const Recording = () => {

  if (enable == true) {

    const record = document.getElementById('RecordButton');

    record.classList.toggle('red');

    startRecording();

    enable = false;

  }

  else {

    const record = document.getElementById('RecordButton');

    record.classList.toggle('red');

    StopRecording();

    enable = true;

  }

};

const startRecording = async () => {

  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {

    if (event.data.size > 0) {

      RecordedChunks.push(event.data);

    }

  };

  mediaRecorder.start();

};

const StopRecording = () => {

  mediaRecorder.stop();

  mediaRecorder.onstop = () => {

    const recordedBlob = new Blob(RecordedChunks, { type: 'video/webm' });

    const videoUrl = URL.createObjectURL(recordedBlob);

    const downloadLink = document.createElement('a');

    downloadLink.href = videoUrl;

    downloadLink.download = 'recorded-video.webm';

    downloadLink.textContent = 'Downloaded Recorded Video';

    downloadLink.click();

    URL.revokeObjectURL(videoUrl);

  };

};

// function of leaving meeting
const leaveMetting = () => {

  const enablevideo = myVideoStream.getVideoTracks()[0].enable;

  const enableAudio = myVideoStream.getAudioTracks()[0].enable;

  if (enablevideo) {

    myVideoStream.getVideoTracks()[0].enabled = false;

  }

  if (enableAudio) {

    myVideoStream.getAudioTracks()[0].enable = false;

  }

  const home = "/";

  window.location.href = `${home}`;

}
