const origin = window.location.href
  .split('//')[1]
  .split(':')[0]
  .split('/')[0]
const url = window.location.href.includes('https')
  ? `wss://${origin}`
  : `ws://${origin}:3000`

// eslint-disable-next-line no-undef
const socket = io(url, {
  reconnectionDelayMax: Infinity
})

const roomIdElem = document.getElementById('roomId')
const createButton = document.getElementById('createButton')
const joinButton = document.getElementById('joinButton')
const copyButton = document.getElementById('copyButton')

const ownerText = document.getElementById('owner')
const joinerText = document.getElementById('joiner')

let id
let isConnected = false

// Listen emits

socket.on('createSuccess', ({ roomId }) => {
  roomIdElem.innerText = roomId
  id = roomId
  roomIdElem.parentElement.classList.add('show')
})

socket.on('joinSuccess', () => {
  isConnected = true
  socket.emit('write', { text: ownerText.value })
})

socket.on('write', ({ text }) => {
  joinerText.innerText = text
})

socket.on('message', ({ message }) => {
  console.log(message)
})

socket.on('leave', () => {
  alert('User leave from room')
  isConnected = false
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
