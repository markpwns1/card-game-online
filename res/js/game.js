let ctx;

let lastTimestamp;

let timeSinceLastFrame = 0.0;
let timeSinceLastNetFrame = 0.0;

const frameInterval = 1000.0 / GAME_INFO.targetFramerate;
const netFrameInterval = 1000.0 / GAME_INFO.networkTickrate;

var Game = {
    canvas: null, // The canvas DOM element
    WIDTH: GAME_INFO.gameWidth,
    HEIGHT: GAME_INFO.gameHeight,
    selfMousePos: { x: 0, y: 0 }, // Local client's mouse position
    otherMousePos: { x: 0, y: 0 }, // Other client's last known mouse position
    otherMousePosSmooth: { x: 0, y: 0 } // Other client's interpolated mouse position
};

function frameLoop(timestamp) {
    requestAnimationFrame(frameLoop, Game.canvas);

    if(!lastTimestamp)
        lastTimestamp = timestamp;

    let delta = timestamp - lastTimestamp;

    timeSinceLastFrame += delta;
    timeSinceLastNetFrame += delta;

    if(timeSinceLastFrame >= frameInterval) {
        timeSinceLastFrame -= frameInterval;

        const dt = delta / 1000.0;

        if(Game.otherMousePos) {
            if(!Game.otherMousePosSmooth)
                Game.otherMousePosSmooth = Game.otherMousePos;
    
            Game.otherMousePosSmooth = Util.vecLerp(Game.otherMousePosSmooth, Game.otherMousePos, 5.0 * dt);
        }

        Game.tick(dt, ctx);
    }

    if(timeSinceLastNetFrame >= netFrameInterval) {
        timeSinceLastNetFrame -= netFrameInterval;

        let toSend = {
            mousePos: {
                pos: Game.selfMousePos
            }
        };

        toSend = { ...toSend, ...Game.netTick(delta / 1000.0) };

        Game.send(toSend);
    }

    lastTimestamp = timestamp;
}

// Sends data in the form of JSON to the other client, and the other 
// client will receive this data in his Game.netReceive()
Game.send = data => {
    GameNetwork.send({
        type: GameNetwork.EVENT_GAME_DATA,
        data: data || { }
    });
};

Game.canvasEvent = (eventName, callback) => {
    Game.canvas.addEventListener(eventName, callback, false);
};


Game.init = () => {
    Game.canvas = $("#game-canvas").get(0);
    ctx = Game.canvas.getContext("2d");

    Game.canvasEvent("mousemove", e => {
        Game.selfMousePos = Util.browserToCanvasCoords(Game.canvas, e);
    });

    Game.canvasEvent("click", e => {
        if(window.isMobile()) {
            // https://www.w3schools.com/howto/howto_js_fullscreen.asp
            if (Game.canvas.requestFullscreen) {
                Game.canvas.requestFullscreen();
            } else if (Game.canvas.webkitRequestFullscreen) { /* Safari */
                Game.canvas.webkitRequestFullscreen();
            } else if (Game.canvas.msRequestFullscreen) { /* IE11 */
                Game.canvas.msRequestFullscreen();
            }
        }
    });

    Game.onInit();
    
    requestAnimationFrame(frameLoop, Game.canvas);
};

Game.receiveOtherMousePos = data => {
    if(data.mousePos) {
        Game.otherMousePos = data.mousePos.pos;
        if(data.mousePos.immediate)
            Game.otherMousePosSmooth = data.mousePos.pos;
    }
}

Game.receiveResetEvent = data => {
    if(data.resetGame) {
        Notifications.send("The other player has reset the game");
        Game.reset();
    }
}
