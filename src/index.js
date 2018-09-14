const body = document.querySelector('body')

// grab all initial login elements
const loginContentDiv = document.querySelector('#login-content')
const loginSidebarDiv = document.getElementById("login-sidebar")
const loginForm = document.getElementById("login-form")
const loginInput = document.getElementById('login-input')
const enterBtn = document.querySelector('#enter')
const loginBox = document.querySelector('#login-minibox')

//grab paint room elements
const paintRoom = document.querySelector('#paintroom')
const chat = document.getElementById("chat")
const usernameCanvas = document.getElementById("username")

// initializing connection variables
let circleWebSocket
let userWebSocket
let currentUser

loginForm.addEventListener('submit', (event) => {
    event.preventDefault()
    loginForm.remove()
    let username = loginInput.value
    let usernameDiv = document.createElement('div')
    // usernameDiv.classList.add('')
    usernameDiv.innerHTML = `Welcome ${username}!`

    enterBtn.classList.remove('hidden')
    loginBox.prepend(usernameDiv)
    usernameCanvas.innerText = username
})


enterBtn.addEventListener('click', () => {
    loadPaintRoom()
    const canvas = document.querySelector('#myCanvas')
    const brushWidth = document.querySelector('#brush-width')
    const palette = document.querySelector('#palette')
    const eraser = document.querySelector('#eraser')
    const brush_size_slider = document.getElementById("brush-size-slider")
    const clearBtn = document.querySelector('#clear-btn')

    let color_form = document.getElementById("color-form")

    loginContentDiv.remove()
    set_current_user()

    paper.install(window);
    paper.setup(canvas);

    // creating the tool and initial paths
    let tool = new Tool();
    let path = new Path();
    let color = "black";
    let strokeWidth = 1
    path.strokeColor = color

    circleWebSocket = openConnection()
    circleWebSocket.onopen = event => {
        const subscribeMsg = {"command":"subscribe","identifier":"{\"channel\":\"CirclesChannel\"}"}
        circleWebSocket.send(JSON.stringify(subscribeMsg))
    }

    messageWebSocket = openConnection()
    messageWebSocket.onopen = e => {
        const subscribeUser = { "command": "subscribe", "identifier": "{\"channel\":\"MessagesChannel\"}" }
        messageWebSocket.send(JSON.stringify(subscribeUser))
    }

    liveCircleSocket(circleWebSocket)

    tool.onMouseDown = function (event) {
        path = new Path();
        path.strokeColor = color
        path.strokeWidth = strokeWidth

        const msg = {
            "command": "message",
            "identifier": "{\"channel\":\"CirclesChannel\"}",
            "data": `{\"action\": \"send_circle\",\"x\": \"${event.point.x}\",\"y\": \"${event.point.y}\",\"strokeColor\": \"${color}\",\"strokeWidth\": \"${strokeWidth}\",\"username\": \"${usernameCanvas.innerText}\"}`
        }
        // console.log(msg)
        circleWebSocket.send(JSON.stringify(msg))
    }

    tool.maxDistance = 1

    tool.onMouseDrag = function (event) {
        let circle = new Path.Circle({
            center: event.middlePoint,
            radius: strokeWidth
        });
        circle.fillColor = color;

        const msg = {
            "command":"message",
            "identifier":"{\"channel\":\"CirclesChannel\"}",
            "data":`{
            \"action\": \"send_circle\",
            \"x\": \"${event.point.x}\",
            \"y\": \"${event.point.y}\",
            \"strokeColor\": \"${color}\",
            \"strokeWidth\": \"${strokeWidth}\",
            \"username\": \"${usernameCanvas.innerText}\"
            }`
        }
        circleWebSocket.send(JSON.stringify(msg))
    }//end mouseDrag

    palette.addEventListener('click', (e) => {
        if (e.target.className === "color") {
            color = e.target.id
            path.strokeColor = color
        }
    })

    eraser.addEventListener('click', () => {
        strokeWidth = 10;
        color = "white";
        brushWidth.innerText = strokeWidth
    })

    brush_size_slider.addEventListener('input', () => {
        strokeWidth = brush_size_slider.value
        brushWidth.innerText = `Brush size ${strokeWidth}:`
    })

    clearBtn.addEventListener('click', clearCanvas)
    liveMessageSocket(messageWebSocket)
})//finish enterBtn eventlistener

function loadPaintRoom() {
    paintRoom.classList.remove('hidden')
    paintRoom.style.display = 'block'
}

    const message_form = document.getElementById("new-message-form")
    message_form.addEventListener('submit', (event) => {
      event.preventDefault();
      let chat_input = document.getElementById("chat-input")
      let chat_li = document.createElement("li")
      chat_li.innerText = `${username_canvas.innerText}: ${chat_input.value}`
      chat.append(chat_li)

      console.log(username_canvas.innerText);
      const msg = {
          "command": "message",
          "identifier": "{\"channel\":\"MessagesChannel\"}",
          "data": `{\"action\": \"send_message\",\"content\": \"${chat_input.value}\",\"username\": \"${username_canvas.innerText}\"}`
      }
      // console.log(msg)
      messageWebSocket.send(JSON.stringify(msg))

      message_form.reset()
    })//end message_form event listener

function liveMessageSocket(messageWebSocket) {
    messageWebSocket.onmessage = event => {
        let result = JSON.parse(event.data)

        if(result['message']['content']){
            if (result['message']['username'] !== usernameCanvas.innerText) {
                let message = document.createElement('li')
                message.innerText = `${result['message']['username']}: ${result['message']['content']}`
                chat.append(message)
            }
        }
    }//end liveMessageSocket function
}

function openConnection() {
    return new WebSocket('ws://localhost:3000/cable')
}

function set_current_user() {

}

function loadCanvas() {
    canvas = document.querySelector('#myCanvas')
    canvas.classList.remove('hidden')
}

function clearCanvas () {
    project.activeLayer.removeChildren()
}

function liveCircleSocket(circleWebSocket) {
    circleWebSocket.onmessage = event => {
        let result = JSON.parse(event.data)
        if (result['message']['username'] !== usernameCanvas.innerText) {
            if (result['message']['x']) {
                let circle = new Path.Circle(new Point(parseInt(result['message']['x']), parseInt(result['message']['y'])), result['message']['strokeWidth'])
                circle.fillColor = result['message']['strokeColor'];
            }
        }
    }
}//end liveCircleSocket function
