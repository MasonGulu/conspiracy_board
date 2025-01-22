/**@type {HTMLCanvasElement} */
var canvas
/**@type {CanvasRenderingContext2D} */
var ctx
/**@type {HTMLDivElement} */
var canvasDiv
/**@type {HTMLImageElement} */
var backgroundImage
/**@type {HTMLButtonElement} */
var saveButton
/**@type {HTMLButtonElement} */
var saveAsButton
/**@type {HTMLInputElement} */
var loadFileInput
/**@type {HTMLButtonElement} */
var loadButton

var projectName
var notes = {}
// relative to center of screen
var rx = -10, ry = 0
var hw = 1, hh = 0
var draggingView = false
var dragx = 0, dragy = 0
var draggingNote = false
var makingConnection = false
var selectedNote
var hoveredNote
var dragrx = 0, dragry = 0
var scale = 1
var isDirty = false

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
const FONT_SIZE = 16

const BACKGROUND_SCALING = 1

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
    const y = cy - rect.top

    return [x, y]
}

function wrapText(text, maxWidth) {
    var words = text.split(" ");
    var lines = [];
    var currentLine = words[0];

    for (var i = 1; i < words.length; i++) {
        var word = words[i];
        var width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
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

function drawTextLines(x, y, text, height, width) {
    for (var i = 0; i < text.length; i++) {
        var s = text[i]
        metrics = ctx.measureText(s)
        var ty = y + i * height
        ctx.fillText(s, x, ty - metrics.emHeightDescent, width)
    }
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
    let lines = wrapText(note.label, note.w * scale)
    drawTextLines(x, y + fontHeight + PIN_SIZE * scale, lines, fontHeight, note.w * scale)
}

function drawYarn(x1, y1, x2, y2) {
    ctx.strokeStyle = "red"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
    ctx.lineWidth = 1
}

function drawYarnConnections(note) {
    let [fx, fy] = worldToScreen(note.x + note.w / 2, note.y)
    for (let i = 0; i < note.connections.length; i++) {
        let cnote = notes[note.connections[i]]
        let [tx, ty] = worldToScreen(cnote.x + cnote.w / 2, cnote.y)
        drawYarn(fx, fy, tx, ty)
    }
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

function roundMultiple(x, m) {
    return Math.ceil(x / m) * m
}

function drawBackground() {
    let w = backgroundImage.width * BACKGROUND_SCALING
    let h = backgroundImage.height * BACKGROUND_SCALING
    let scaledW = w * scale
    let scaledH = h * scale
    let [wx, wy] = screenToWorld(-scaledW, -scaledH)
    let mx = roundMultiple(wx, w)
    let my = roundMultiple(wy, h)
    let [cornerX, cornerY] = worldToScreen(mx, my)
    let copiesWide = 1 + Math.ceil(ctx.canvas.width / scaledW)
    let copiesTall = 1 + Math.ceil(ctx.canvas.height / scaledH)
    for (let y = 0; y < copiesTall; y++) {
        for (let x = 0; x < copiesWide; x++) {
            let ix = Math.floor(cornerX + scaledW * x)
            let iy = Math.floor(cornerY + scaledH * y)
            ctx.drawImage(backgroundImage, ix, iy, Math.ceil(scaledW), Math.ceil(scaledH))
        }
    }
}

function draw() {
    ctx.canvas.width = canvasDiv.clientWidth
    hw = ctx.canvas.width / 2
    ctx.canvas.height = canvasDiv.clientHeight
    hh = ctx.canvas.height / 2
    drawBackground()
    drawRoot()
    for (let [key, note] of Object.entries(notes)) {
        drawNote(note)
    }
    if (makingConnection) {
        let [fx, fy] = worldToScreen(selectedNote.x + selectedNote.w / 2, selectedNote.y)
        drawYarn(fx, fy, dragx, dragy)
    }
    for (let [key, note] of Object.entries(notes)) {
        drawYarnConnections(note)
    }
    for (let [key, note] of Object.entries(notes)) {
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

function withinRectangle(x, y, x1, y1, w, h) {
    return x >= x1 && y >= y1 && x <= x1 + w && y <= y1 + h
}

// Give x and y in worldspace
function isOnNote(note, x, y) {
    return withinRectangle(x, y, note.x, note.y, note.w, note.h)
}

function updateHover(e) {
    var [cx, cy] = adjustForCanvasPos(e.x, e.y)
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

function removeConnection(a, b) {
    for (let i = 0; i < a.connections.length; i++) {
        let cid = a.connections[i]
        if (cid == b.id) {
            a.connections.splice(i, 1)
            return true
        }
    }
    for (let j = 0; j < b.connections.length; j++) {
        let cid = b.connections[j]
        if (cid == a.id) {
            b.connections.splice(j, 1)
            return true
        }
    }
}

function downloadObjectAsJson(exportObj, exportName) {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".board");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function saveAs() {
    projectName = prompt("File Name?")
    if (projectName) {
        save()
    }
}

function save() {
    if (!projectName) {
        return saveAs()
    }
    downloadObjectAsJson(notes, projectName)
    isDirty = false
}

function onLoad(e) {
    let lines = e.target.result
    notes = JSON.parse(lines)
    frameUpdate = true
    isDirty = false
}

window.onload = function () {
    canvas = document.getElementById("mainCanvas")
    canvasDiv = document.getElementById("canvasContainer")
    ctx = canvas.getContext("2d")
    backgroundImage = document.getElementById("backgroundImage")
    saveButton = document.getElementById("saveButton")
    saveAsButton = document.getElementById("saveAsButton")
    loadFileInput = document.getElementById("loadFileInput")
    loadButton = document.getElementById("loadButton")
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

    loadFileInput.addEventListener("change", (e) => {
        fn = e.target.files[0]
        if (fn) {
            fr = new FileReader()
            fr.onload = onLoad
            fr.readAsText(fn)
            fns = fn.name
            projectName = fns.slice(0, -6)
        }
    })

    saveButton.addEventListener("click", save)
    saveAsButton.addEventListener("click", saveAs)
    loadButton.addEventListener("click", (e) => {
        loadFileInput.click()
    })

    canvas.addEventListener("mousedown", (e) => {
        var [cx, cy] = adjustForCanvasPos(e.x, e.y)
        var [wx, wy] = screenToWorld(cx, cy)
        if (hoveredNote != null) {
            selectedNote = hoveredNote
            if (e.button == 0) {
                draggingNote = true
                dragx = wx - selectedNote.x
                dragy = wy - selectedNote.y
            } else {
                makingConnection = true
                dragx = cx
                dragy = cy
            }
            frameUpdate = true
            return
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
        } else if (makingConnection) {
            dragx = cx
            dragy = cy
            frameUpdate = true
        }
        updateHover(e)
    })

    canvas.addEventListener("mouseup", (e) => {
        if (makingConnection && hoveredNote != null && !removeConnection(selectedNote, hoveredNote)) {
            selectedNote.connections.push(hoveredNote.id)
        }
        if (draggingNote || makingConnection) {
            isDirty = true
        }
        draggingView = false
        draggingNote = false
        makingConnection = false
        frameUpdate = true
    })

    canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault()
    })

    document.getElementById("insertNoteButton").onclick = function () {
        newNote()
        frameUpdate = true
        isDirty = true
    }

    document.getElementById("labelButton").onclick = function () {
        if (selectedNote != null) {
            let nlabel = window.prompt("Note Label", selectedNote.label)
            selectedNote.label = nlabel
            frameUpdate = true
            isDirty = true
        }
    }

    window.addEventListener("beforeunload", function (e) {
        if (!isDirty) {
            return undefined;
        }

        var confirmationMessage = 'If you leave before saving, your changes will be lost.'
        return confirmationMessage
    });

    requestAnimationFrame(animate)
}

window.onresize = function () {
    draw()
}


