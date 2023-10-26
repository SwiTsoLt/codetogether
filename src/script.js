// eslint-disable-next-line no-undef
const socket = io()

const roomIdElem = document.getElementById('roomId')
const createButton = document.getElementById('createButton')
const joinButton = document.getElementById('joinButton')
const copyButton = document.getElementById('copyButton')
const audioElem = document.querySelector('audio')

const ownerText = document.getElementById('owner')
const joinerText = document.getElementById('joiner')

let id
let isConnected = false

const pc = new RTCPeerConnection({
    iceServers: [
        {
            urls: ['stun:stun.voiparound.com']
        },
        {
            urls: ['stun:stun.voxgratia.org']
        }
    ]
})

// Listen emits

socket.on('createSuccess', ({ roomId }) => {
  roomIdElem.innerText = roomId
  id = roomId
  roomIdElem.parentElement.classList.add('show')
})

socket.on('joinSuccess', () => {
  alert('Join success!')
  isConnected = true
  socket.emit('write', { text: ownerText.value })
})

socket.on('write', ({ text }) => {
  joinerText.innerText = text
})

socket.on('message', ({ message }) => {
  alert(message)
})

socket.on('leave', () => {
  alert('User leave from room')
  isConnected = false
})

// WebRTC handle emits

socket.on('startWebRtcConnection', () => [
  startWebRtcConnection()
])

socket.on('description', async ({ description }) => {
  if (pc.localDescription) {
    await pc.setRemoteDescription(description)
  } else {
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } })
      .then(async stream => {
        await pc.setRemoteDescription(description)

        stream.getAudioTracks().forEach(track => pc.addTrack(track))

        const localDescription = await pc.createAnswer()
        pc.setLocalDescription(localDescription)
        socket.emit('description', { description: localDescription })
      })
  }
})

socket.on('icecandidate', async ({ candidate }) => {
  if (pc.remoteDescription) {
    await pc.addIceCandidate(candidate)
  }
})

// Handle buttons

function createRoom () {
  socket.emit('create')
}

function joinRoom () {
  const roomId = prompt('Room id: ')
  if (!roomId) return
  socket.emit('join', { roomId })
}

function copyRoomId () {
  navigator.clipboard.writeText(id)
}

function handleWrite () {
  if (isConnected) {
    socket.emit('write', { text: ownerText.value })
  }
}

createButton.addEventListener('click', createRoom)
joinButton.addEventListener('click', joinRoom)
copyButton.addEventListener('click', copyRoomId)
ownerText.addEventListener('input', handleWrite)

// WebRtc

pc.addEventListener('icecandidate', event => {
  if (event.candidate) {
    socket.emit('icecandidate', { candidate: event.candidate })
  }
})

pc.addEventListener('datachannel', () => {
  console.log('web rtc connect!')
})

pc.addEventListener('track', event => {
  const m = new MediaStream()
  m.addTrack(event.track)
  audioElem.srcObject = m
  audioElem.play()
  console.log('play')
})

function startWebRtcConnection () {
  navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } })
    .then(async stream => {
      const dataChannel = pc.createDataChannel('audioChannel')

      stream.getTracks().forEach((track) => pc.addTrack(track))

      dataChannel.addEventListener('open', () => {
        console.log('web rtc connect!')
      })

      const description = await pc.createOffer()
      await pc.setLocalDescription(description)

      socket.emit('description', { description })
    })
}
