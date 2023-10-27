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
const tabsElem = document.getElementById('tabs')
const joinersTabsElem = document.getElementById('joinersTabs')

const createButton = document.getElementById('createButton')
const joinButton = document.getElementById('joinButton')
const copyButton = document.getElementById('copyButton')

const ownerText = document.getElementById('owner')
const joinerText = document.getElementById('joiner')

let roomId, myId, myName
const clients = {}
let isConnected = false
let currentTab = 0

// Listen emits

socket.on('myId', ({ id }) => {
  myId = id
})

socket.on('createSuccess', ({ id }) => {
  roomIdElem.innerText = id
  roomId = id
  roomIdElem.parentElement.classList.add('show')
})

socket.on('joinSuccess', ({ roomClients, name }) => {
  Object.keys(clients).forEach(clientId => { clients[clientId] = undefined })

  roomClients.forEach(clientId => {
    clients[clientId] = {}
    clients[clientId].text = ''
  })

  isConnected = true

  tabsElem.classList.add('show')
  roomIdElem.innerText = roomId

  roomIdElem.parentElement.classList.add('show')
  initTabs()
  socket.emit('write', { text: ownerText.value, name: myName })
})

socket.on('write', ({ text, name, id }) => {
  clients[id] = {
    text,
    name
  }

  if (!currentTab) {
    currentTab = id
  }

  joinerText.innerText = clients[currentTab].text

  if (name) {
    initTabs()
  }
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
  myName = prompt('Enter your name:')
  myIdElem.innerText = myName
  socket.emit('create')
}

function joinRoom () {
  roomId = prompt('Room id: ')
  if (!roomId) return
  myName = prompt('Enter your name:')
  myIdElem.innerText = myName
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

  Object.keys(clients).forEach(clientId => {
    if (clientId === myId) return

    const buttonElem = document.createElement('button')
    buttonElem.classList.add('tab')
    buttonElem.tab = clientId

    if (Object.keys(clients).length >= 3) {
      buttonElem.classList.add('select')

      if ((clientId === currentTab || !currentTab)) {
        buttonElem.classList.add('active')
        currentTab = clientId
      }
    }

    buttonElem.innerText = clients[clientId].name

    buttonElem.addEventListener('click', event => {
      joinersTabsElem.childNodes.forEach(node => node.classList.remove('active'))
      event.target.classList.add('active')
      currentTab = event.target.tab
      joinerText.innerText = clients[currentTab].text
    })

    joinersTabsElem.appendChild(buttonElem)
  })
}

createButton.addEventListener('click', createRoom)
joinButton.addEventListener('click', joinRoom)
copyButton.addEventListener('click', copyRoomId)
ownerText.addEventListener('input', handleWrite)
