const sprites = { };

let selfMousePos;

let otherMousePos;
let otherMousePosSmooth;
let otherMouseDown = false;

Game.onInit = canvas => {

    sprites.handOpen = Graphics.loadImage("res/images/hand_open.png");
    sprites.handClosed = Graphics.loadImage("res/images/hand_closed.png");

    Game.canvasEvent("mousemove", e => {
        selfMousePos = Util.getMousePos(canvas, e);
    });

    Game.canvasEvent("mousedown", e => {
        Game.send({ mouseDown: true });
    });

    Game.canvasEvent("mouseup", e => {
        Game.send({ mouseDown: false });
    });
}

Game.tick = (dt, g) => {
    Graphics.clear(g, "green");

    if(otherMousePos) {
        if(!otherMousePosSmooth)
            otherMousePosSmooth = otherMousePos;

        otherMousePosSmooth = Util.vecLerp(otherMousePosSmooth, otherMousePos, 5.0 * dt);
    }

    if(otherMousePosSmooth) {
        let handSprite = otherMouseDown? sprites.handClosed : sprites.handOpen;
        g.drawImage(handSprite, otherMousePosSmooth.x, otherMousePosSmooth.y, handSprite.width, handSprite.height);
    }

}

Game.netReceive = data => {
    otherMousePos = data.mousePos || otherMousePos;
    otherMouseDown = data.mouseDown === undefined? otherMouseDown : data.mouseDown;
}

Game.netTick = dt => {
    Game.send({
        mousePos: selfMousePos
    });
}