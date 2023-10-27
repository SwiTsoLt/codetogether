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
const myIdElem = document.getElementById('myId')
const joinersTabsElem = document.getElementById('joinersTabs')
const createButton = document.getElementById('createButton')
const joinButton = document.getElementById('joinButton')
const copyButton = document.getElementById('copyButton')

const ownerText = document.getElementById('owner')
const joinerText = document.getElementById('joiner')

let roomId, myId
const clients = {}
let isConnected = false
let currentTab = 0

// Listen emits

socket.on('myId', ({ id }) => {
  myId = id
  myIdElem.innerText = myId
})

socket.on('createSuccess', ({ id }) => {
  roomIdElem.innerText = id
  roomId = id
  roomIdElem.parentElement.classList.add('show')
})

socket.on('joinSuccess', ({ roomClients }) => {
  Object.keys(clients).forEach(clientId => { clients[clientId] = undefined })
  console.log(clients);
  roomClients.forEach(clientId => {
    clients[clientId] = ''
  })
  isConnected = true
  initTabs()
  socket.emit('write', { text: ownerText.value })
})

socket.on('write', ({ text, id }) => {
  clients[id] = text
  if (!currentTab) {
    currentTab = id
  }
  joinerText.innerText = clients[currentTab]
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
  navigator.clipboard.writeText(roomId)
}

function handleWrite () {
  if (isConnected) {
    socket.emit('write', { text: ownerText.value })
  }
}

function initTabs () {
  joinersTabsElem.innerHTML = ''

  console.log(clients)
  Object.keys(clients).forEach(clientId => {
    if (clientId === myId) return

    const buttonElem = document.createElement('button')
    buttonElem.classList.add('tab')
    buttonElem.tab = clientId

    if (clientId === currentTab || !currentTab) {
      buttonElem.classList.add('active')
      currentTab = clientId
    }

    buttonElem.innerText = clientId

    buttonElem.addEventListener('click', event => {
      joinersTabsElem.childNodes.forEach(node => node.classList.remove('active'))
      event.target.classList.add('active')
      currentTab = event.target.tab
      joinerText.innerText = clients[currentTab]
    })

    joinersTabsElem.appendChild(buttonElem)
  })
}

createButton.addEventListener('click', createRoom)
joinButton.addEventListener('click', joinRoom)
copyButton.addEventListener('click', copyRoomId)
ownerText.addEventListener('input', handleWrite)
