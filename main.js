var canvas
/**@type {CanvasRenderingContext2D} */
var ctx

var notes = {}
// relative to center of screen
var rx = -10, ry = 0
var hw = 1, hh = 0
var draggingView = false
var dragx = 0, dragy = 0
var draggingNote = false
var selectedNote
var hoveredNote
var dragrx = 0, dragry = 0
var scale = 1

var frameUpdate = false


var menuOpen = false
const MENU_FONT = "20px Verdana"
var menuOptions = [
    {
        "label": "New",
        "press": function () { }
    },
    {
        "label": "AIODFJSJFiJSDOfjsaojfojdfjadisjfojosdf"
    },
    {
        "label": "eeeeee"
    }
]

const FONT_STYLE = "px Verdana"
const FONT_SIZE = 20

const NOTE_PADDING = 3
const NOTE_PRIMARY = "#f5eb92"
const NOTE_SECONDARY = "#ebe15d"
const NOTE_HIGHLIGHT_PAD = 5
const NOTE_SELECTED = "black"
const NOTE_HOVERED = "yellow"

const PIN_SIZE = 10
const PIN_SECOND_SIZE = 8
const PIN_OFFSET = 2
const PIN_SECOND_OFFSET = 5
const PIN_PRIMARY = "#c60001"
const PIN_SECONDARY = "#440000"

function worldToScreen(wx, wy) {
    return [scale * (wx + rx) + hw, scale * (wy + ry) + hh]
}

function screenToWorld(sx, sy) {
    return [(sx - hw) / scale - rx, (sy - hh) / scale - ry]
}

function adjustForCanvasPos(cx, cy) {
    const rect = canvas.getBoundingClientRect()
    const x = cx - rect.left
    const y = cy - rect.top / 2

    return [x, y]
}

function newNote() {
    let [x, y] = screenToWorld(hw, hh)
    let note = {
        "x": x,
        "y": y,
        "w": 100,
        "h": 100,
        "label": "Hello World",
        "id": crypto.randomUUID(),
        "connections": []
    }
    notes[note.id] = note
    return note
}

function drawPin(x, y) {
    ctx.fillStyle = PIN_PRIMARY
    ctx.beginPath()
    var [px, py] = worldToScreen(x, y)
    ctx.ellipse(px, py, PIN_SIZE * scale, PIN_SIZE * scale, 0, 0, 2 * Math.PI)
    ctx.fill()
    ctx.beginPath()
    ctx.fillStyle = PIN_SECONDARY
    var [px, py] = worldToScreen(x + PIN_OFFSET, y - PIN_OFFSET)
    ctx.ellipse(px, py, PIN_SECOND_SIZE * scale, PIN_SECOND_SIZE * scale, 0, 0, 2 * Math.PI)
    ctx.fill()
    ctx.fillStyle = PIN_PRIMARY
    ctx.beginPath()
    var [px, py] = worldToScreen(x + PIN_SECOND_OFFSET, y - PIN_SECOND_OFFSET)
    ctx.ellipse(px, py, PIN_SECOND_SIZE * scale, PIN_SECOND_SIZE * scale, 0, 0, 2 * Math.PI)
    ctx.fill()
    ctx.fillStyle = "black"
}

function drawBorderAroundNote(note) {
    var [x, y] = worldToScreen(note.x, note.y)
    ctx.lineWidth = 4
    ctx.strokeRect(x, y, (note.w + NOTE_PADDING) * scale, (note.h + NOTE_PADDING) * scale)
    ctx.lineWidth = 1
}

function drawNote(note) {
    var [x, y] = worldToScreen(note.x, note.y)
    if (note == selectedNote) {
        ctx.fillStyle = NOTE_SELECTED
        ctx.strokeStyle = NOTE_SELECTED
        drawBorderAroundNote(note)
    } else if (note == hoveredNote) {
        ctx.fillStyle = NOTE_HOVERED
        ctx.strokeStyle = NOTE_HOVERED
        drawBorderAroundNote(note)
    }
    ctx.fillStyle = NOTE_SECONDARY
    ctx.fillRect(x, y, (note.w + NOTE_PADDING) * scale, (note.h + NOTE_PADDING) * scale)
    ctx.fillStyle = NOTE_PRIMARY
    ctx.fillRect(x, y, note.w * scale, note.h * scale)

    ctx.fillStyle = "black"
    const fontHeight = FONT_SIZE * scale
    ctx.font = fontHeight + FONT_STYLE
    ctx.fillText(note.label, x, y + fontHeight + PIN_SIZE * scale, note.w * scale)
}

function drawYarnConnections(note) {
    let [fx, fy] = worldToScreen(note.x + note.w / 2, note.y)
    ctx.strokeStyle = "red"
    ctx.lineWidth = 2
    for (let i = 0; i < note.connections.length; i++) {
        ctx.beginPath()
        ctx.moveTo(fx, fy)
        let cnote = notes[note.connections[i]]
        let [tx, ty] = worldToScreen(cnote.x + cnote.w / 2, cnote.y)
        ctx.lineTo(tx, ty)
        ctx.stroke()
    }
    ctx.lineWidth = 1
}

function drawRoot() {
    ctx.fillStyle = "black"
    var [x, y] = worldToScreen(0, 0)
    ctx.fillRect(x - 2, y, 5, 1)
    ctx.fillRect(x, y - 2, 1, 5)
}

function drawMenu(x, y, options) {
    var width = 10
    var optionHeight = 10
    ctx.font = MENU_FONT
    var metrics = []
    for (var i = 0; i < options.length; i++) {
        var option = options[i]
        metrics[i] = ctx.measureText(option.label)
        optionHeight = Math.max(metrics[i].emHeightAscent + metrics[i].emHeightDescent, optionHeight)
        width = Math.max(width, metrics[i].width)
    }
    ctx.fillStyle = "white"
    ctx.fillRect(x, y, width, optionHeight * options.length)
    for (var i = 0; i < options.length; i++) {
        var option = options[i]
        var ty = y + i * optionHeight
        options[i].dy = i * optionHeight
        ctx.strokeStyle = "black"
        ctx.strokeRect(x, ty, width, optionHeight)
        ctx.fillStyle = "black"
        ctx.fillText(option.label, x, ty + optionHeight - metrics[i].emHeightDescent)
    }
}

function draw() {
    ctx.canvas.width = window.innerWidth
    hw = ctx.canvas.width / 2
    ctx.canvas.height = window.innerHeight
    hh = ctx.canvas.height / 2
    drawRoot()
    for (let [key, note] of Object.entries(notes)) {
        drawNote(note)
    }
    for (let [key, note] of Object.entries(notes)) {
        drawYarnConnections(note)
        drawPin(note.x + note.w / 2, note.y)
    }
}

function animate() {
    if (frameUpdate) {
        draw()
    }
    frameUpdate = false
    requestAnimationFrame(animate)
}

let a = newNote()
let b = newNote()

a.connections[0] = b.id

function withinRectangle(x, y, x1, y1, w, h) {
    return x >= x1 && y >= y1 && x <= x1 + w && y <= y1 + h
}

// Give x and y in worldspace
function isOnNote(note, x, y) {
    return withinRectangle(x, y, note.x, note.y, note.w, note.h)
}

window.onload = function () {
    canvas = document.getElementById("mainCanvas")
    ctx = canvas.getContext("2d")
    draw()

    canvas.addEventListener("wheel", function (e) {
        const scrollDirection = e.deltaY < 0 ? -1 : 1
        if (scrollDirection > 0) {
            // zoom in
            scale -= 0.1
        } else {
            scale += 0.1
        }
        scale = Math.max(0.4, Math.min(2, scale))
        draw()
    })

    canvas.addEventListener("mousedown", (e) => {
        var [cx, cy] = adjustForCanvasPos(e.x, e.y)
        var [wx, wy] = screenToWorld(cx, cy)
        for (let [key, note] of Object.entries(notes)) {
            if (isOnNote(note, wx, wy)) {
                draggingNote = true
                selectedNote = note
                frameUpdate = true
                dragx = wx - note.x
                dragy = wy - note.y
                return
            }
        }
        dragx = cx
        dragy = cy
        selectedNote = null
        draggingView = true
        dragrx = rx
        dragry = ry
    })


    canvas.addEventListener("mousemove", (e) => {
        let [cx, cy] = adjustForCanvasPos(e.x, e.y)
        if (draggingView) {
            rx = dragrx + (cx - dragx) / scale
            ry = dragry + (cy - dragy) / scale
            frameUpdate = true
        } else if (draggingNote) {
            var [nx, ny] = screenToWorld(cx, cy)
            selectedNote.x = nx - dragx
            selectedNote.y = ny - dragy
            frameUpdate = true
        } else {
            var [wx, wy] = screenToWorld(cx, cy)
            for (let [key, note] of Object.entries(notes)) {
                if (isOnNote(note, wx, wy)) {
                    if (hoveredNote != note) {
                        hoveredNote = note
                        frameUpdate = true
                    }
                    return
                }
            }
            if (hoveredNote != null) {
                hoveredNote = null
                frameUpdate = true
            }
        }
    })

    canvas.addEventListener("mouseup", (e) => {
        draggingView = false
        draggingNote = false
        frameUpdate = true
    })

    canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault()
    })

    document.getElementById("insertNoteButton").onclick = function () {
        notes[notes.length] = newNote()
        frameUpdate = true
    }

    document.getElementById("labelButton").onclick = function () {
        if (selectedNote != null) {
            let nlabel = window.prompt("Note Label", selectedNote.label)
            selectedNote.label = nlabel
            frameUpdate = true
        }
    }

    requestAnimationFrame(animate)
}

window.onresize = function () {
    draw()
}


