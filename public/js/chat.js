const socket = io()
//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFromInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-template').innerHTML
const sidebartemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild

    //Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have i scroll
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('locationMessage',(message) => {
    console.log(message.url)
    const html = Mustache.render(locationMessageTemplate, {
        username:message.username,
        url:message.url,
        createdAt:moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})


socket.on('message',(message) => {
    console.log(message)
    const html =Mustache.render(messageTemplate, {
        username:message.username,
        message:message.text,
        createdAt: moment(message.createdAt).format('h:mm A')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({ room, users }) => {
    const html = Mustache.render(sidebartemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

document.querySelector('#message-form').addEventListener('submit',(e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')
    //disable button
    const message = e.target.elements.message.value

    socket.emit('sendMessage',message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFromInput.value=''
        $messageFromInput.focus()
        //enable button
        if(error){
            return console.log(error)
        }
        console.log('Message delivered!')
    })
})

$locationButton.addEventListener('click',() => {
    if(!navigator.geolocation){
        return alert('Geolocation i snot supported by your Browser')
    }
    $locationButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        },() => {
            $locationButton.removeAttribute('disabled')
            console.log('Location Shared.')
        })
    })
})

socket.emit('join',{username,room},(error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})