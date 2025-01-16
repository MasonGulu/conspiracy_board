var canvas
/**@type {CanvasRenderingContext2D} */
var ctx

var notes = []
// relative to center of screen
var rx = -10, ry = 0
var hw = 1, hh = 0
var draggingView = false
var dragx = 0, dragy = 0
var draggingNote = false
var selectedNote
var dragrx = 0, dragry = 0
var scale = 1

var frameUpdate = false

const FONT_STYLE = "px Verdana"
const FONT_SIZE = 20

const NOTE_PADDING = 3
const NOTE_PRIMARY = "#f5eb92"
const NOTE_SECONDARY = "#ebe15d"
const NOTE_HIGHLIGHT_PAD = 5
const NOTE_HIGHLIGHT = "black"

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

function newNote() {
    let [x, y] = screenToWorld(hw, hh)
    return {
        "x": x,
        "y": y,
        "w": 100,
        "h": 100,
        "label": "Hello World"
    }
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

function drawNote(note) {
    var [x, y] = worldToScreen(note.x, note.y)
    if (note == selectedNote) {
        ctx.fillStyle = NOTE_HIGHLIGHT
        ctx.strokeStyle = NOTE_HIGHLIGHT
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, (note.w + NOTE_PADDING) * scale, (note.h + NOTE_PADDING) * scale)

    }
    ctx.fillStyle = NOTE_SECONDARY
    ctx.fillRect(x, y, (note.w + NOTE_PADDING) * scale, (note.h + NOTE_PADDING) * scale)
    ctx.fillStyle = NOTE_PRIMARY
    ctx.fillRect(x, y, note.w * scale, note.h * scale)

    drawPin(note.x + note.w / 2, note.y)

    const fontHeight = FONT_SIZE * scale
    ctx.font = fontHeight + FONT_STYLE
    ctx.fillText(note.label, x, y + fontHeight + PIN_SIZE * scale, note.w * scale)
}

function drawRoot() {
    ctx.fillStyle = "black"
    var [x, y] = worldToScreen(0, 0)
    ctx.fillRect(x - 2, y, 5, 1)
    ctx.fillRect(x, y - 2, 1, 5)
}

function draw() {
    ctx.canvas.width = window.innerWidth
    hw = ctx.canvas.width / 2
    ctx.canvas.height = window.innerHeight
    hh = ctx.canvas.height / 2
    drawRoot()
    notes.forEach(drawNote)
}

function animate() {
    if (frameUpdate) {
        draw()
    }
    frameUpdate = false
    requestAnimationFrame(animate)
}

notes[0] = newNote()

function isOnNote(note, x, y) {
    return x >= note.x && y >= note.y && x <= note.x + note.w && y <= note.y + note.h
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
        var [wx, wy] = screenToWorld(e.x, e.y)
        for (var i = 0; i < notes.length; i++) {
            var note = notes[i]
            if (isOnNote(note, wx, wy)) {
                draggingNote = true
                selectedNote = note
                frameUpdate = true
                dragx = wx - note.x
                dragy = wy - note.y
                return
            }
        }
        dragx = e.x
        dragy = e.y
        selectedNote = null
        draggingView = true
        dragrx = rx
        dragry = ry
    })
    canvas.addEventListener("mousemove", (e) => {
        if (draggingView) {
            rx = dragrx + (e.x - dragx) / scale
            ry = dragry + (e.y - dragy) / scale
            frameUpdate = true
        } else if (draggingNote) {
            var [nx, ny] = screenToWorld(e.x, e.y)
            selectedNote.x = nx - dragx
            selectedNote.y = ny - dragy
            frameUpdate = true
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

    requestAnimationFrame(animate)
}

window.onresize = function () {
    draw()
}