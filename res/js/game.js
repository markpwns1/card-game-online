let canvas;
let ctx;

let lastTimestamp;
let timeSinceLastFrame;

const FRAMERATE = 60;

const frameInterval = 1000.0 / FRAMERATE;

var Game = {
    WIDTH: 800,
    HEIGHT: 600
};

// https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

let x = 0;


function tick(timestamp) {
    requestAnimationFrame(tick, canvas);

    if(!lastTimestamp)
        lastTimestamp = timestamp;

    if(timeSinceLastFrame > )

    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, Game.WIDTH, Game.HEIGHT);

}

Game.init = () => {
    canvas = $("#game-canvas").get(0);
    ctx = canvas.getContext("2d");
    // ctx.fillStyle = "green";
    // ctx.fillRect(0, 0, Game.WIDTH, Game.HEIGHT);

    requestAnimationFrame(tick, canvas);
};