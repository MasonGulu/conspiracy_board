function sumLetters(str) {
    let sum = 0;

    for (let i = 0; i < str.length; i++) {
        sum += str.charCodeAt(i)
    }

    return sum;
}

function drawVoronoiBackground() {
    for (let y = 0; y < ctx.canvas.height; y++) {
        for (let x = 0; x < ctx.canvas.width; x++) {
            let closestDistance = 1000000000
            let closestNote
            let [wx, wy] = screenToWorld(x, y)
            for (let [key, note] of Object.entries(notes)) {
                let distance = (wx - note.x) ** 2 + (wy - note.y) ** 2
                if (distance < closestDistance) {
                    closestDistance = distance
                    closestNote = note
                }
            }
            if (closestNote) {
                ctx.fillStyle = voronoiColors[sumLetters(closestNote.id) % voronoiColors.length]
            }
            ctx.fillRect(x, y, 1, 1)
        }
    }
}