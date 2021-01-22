let canvas;
let ctx;

let lastTimestamp;

let timeSinceLastFrame = 0.0;
let timeSinceLastNetFrame = 0.0;

const FRAMERATE = 60;
const frameInterval = 1000.0 / FRAMERATE;

const NETWORK_FRAMERATE = 10;
const netFrameInterval = 1000.0 / GAME_INFO.networkTickrate;

// let hand;

var Game = {
    WIDTH: 800,
    HEIGHT: 600
};

function frameLoop(timestamp) {
    requestAnimationFrame(frameLoop, canvas);

    if(!lastTimestamp)
        lastTimestamp = timestamp;

    let delta = timestamp - lastTimestamp;

    timeSinceLastFrame += delta;
    timeSinceLastNetFrame += delta;

    if(timeSinceLastFrame >= frameInterval) {
        timeSinceLastFrame -= frameInterval;
        Game.tick(delta / 1000.0, ctx);
    }

    if(timeSinceLastNetFrame >= netFrameInterval) {
        timeSinceLastNetFrame -= netFrameInterval;
        Game.netTick(delta / 1000.0);
    }

    lastTimestamp = timestamp;

    // console.log(timeSinceLastFrame);

}

Game.init = () => {
    canvas = $("#game-canvas").get(0);
    ctx = canvas.getContext("2d");

    Game.onInit(canvas);

    // ctx.fillStyle = "green";
    // ctx.fillRect(0, 0, Game.WIDTH, Game.HEIGHT);

    requestAnimationFrame(frameLoop, canvas);
};

Game.send = data => {
    GameNetwork.send({
        type: GameNetwork.EVENT_GAME_DATA,
        data: data || { }
    });
};

Game.canvasEvent = (eventName, callback) => {
    canvas.addEventListener(eventName, callback, false);
};
