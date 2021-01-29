const sprites = { };

let selfMousePos;

let otherMousePos;
let otherMousePosSmooth;
let otherMouseDown = false;

let leftMouseDown = false;
let middleMouseDown = false;
let rightMouseDown = false;

const cards = [
    "rh1", "rh2", "rh3"
];

let stacks = [ ];

let stackIDCounter = 0;

class Stack {
    id = -1;
    cards = [ ];
    pos = { x: 0, y: 0 };
    size = { x: 100, y: 150 };
    isFaceDown = false;

    dragOffset = { x: 0, y: 0 };
    isSelfDragging = false;
    isOtherDragging = false;

    constructor(cards, pos, faceDown = false) {
        this.cards = [ ...cards ];
        this.pos = pos;
        this.isFaceDown = faceDown;
        this.id = ++stackIDCounter;
    }

    getTop() {
        return this.cards[this.cards.length - 1];
    }

    getRect() {
        return { x: this.pos.x, y: this.pos.y, width: this.size.x, height: this.size.y };
    }

    update(dt) {
        if(this.isSelfDragging) {
            this.pos = { x: selfMousePos.x + this.dragOffset.x, y: selfMousePos.y + this.dragOffset.y };
        }
        else if(this.isOtherDragging) {
            this.pos = { 
                x: otherMousePosSmooth.x + this.dragOffset.x, 
                y: otherMousePosSmooth.y + this.dragOffset.y 
            };
        }
    }

    draw(g) {
        if(this.isSelfDragging || this.isOtherDragging) {
            g.drawImage(sprites.shadow, this.pos.x + 20, this.pos.y + 20, this.size.x, this.size.y + (this.cards.length - 1) * 10);
        }

        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            if(!sprites["card_" + (this.isFaceDown? "back" : card)]) {
                console.log(card);
                return;
            }
            g.drawImage(sprites["card_" + (this.isFaceDown? "back" : card)], this.pos.x, this.pos.y + i * 10, this.size.x, this.size.y);
        }
    }

    updateCards(cards, foreign = false) {
        this.cards = cards;
        if(!foreign)
            toSend = {
                ...toSend,
                updateStackCards: {
                    id: this.id,
                    cards: cards
                }
            };
    }

    beginDrag(foreign = false) {
        this.pos = { x: this.pos.x - 20, y: this.pos.y - 20 };

        if(foreign) {
            this.isOtherDragging = true;

            this.dragOffset = { 
                x: this.pos.x - otherMousePosSmooth.x, 
                y: this.pos.y - otherMousePosSmooth.y 
            };
        }    
        else {
            this.isSelfDragging = true;

            this.dragOffset = { 
                x: this.pos.x - selfMousePos.x, 
                y: this.pos.y - selfMousePos.y 
            };

            toSend = { 
                ...toSend, 
                begunDrag: this.id
            };
        }
    }

    endDrag(foreign = false) {
        if(foreign) {
            this.isOtherDragging = false;
        }
        else {
            this.isSelfDragging = false;
            this.pos = { x: this.pos.x + 20, y: this.pos.y + 20 };

            toSend = { 
                ...toSend, 
                endedDrag: {
                    id: this.id,
                    finalPos: this.pos
                }
            };
        }
    }
}

let s;

let toSend = { };

let onMouseDown = e => {
    toSend = { };

    if(e.button == 0 || e.button == 1)
        toSend = { mouseDown: true };

    for (const stack of stacks) {
        if(stack.isOtherDragging || !Util.pointInRect(selfMousePos, stack.getRect())) continue;

        // if(!stack.isOtherDragging && e.button == 2) {
        //     stack.isFaceDown = !stack.isFaceDown;
        // } 
        // else 
        if(e.button == 0 || (e.button == 1 && stack.cards.length == 1)) {
            stack.beginDrag();
        }
        else if(e.button == 1) {
            const card = stack.cards.pop();
            stack.updateCards(stack.cards);
            // const newStack = new Stack(card, { ...stack.pos }, stack.isFaceDown);
            // stacks.push(newStack);
            const newStack = instantiateStack([ card ], { ...stack.pos })
            // stack.endDrag();
            newStack.beginDrag();
        }
    }

    Game.send(toSend);
};

let onMouseUp = e => {
    toSend = { };

    if(e.button == 0 || e.button == 1)
        toSend = { mouseDown: false };

    for (let i = stacks.length - 1; i >= 0; i--) {
        const stack = stacks[i];

        if(stack.isSelfDragging && (e.button == 0 || (e.button == 1 && stack.cards.length == 1))) {
            
            stack.endDrag();

            for (const otherStack of stacks) {
                if(stack == otherStack) continue;

                if(Util.dist(stack.pos, otherStack.pos) < 50) {
                    otherStack.updateCards(otherStack.cards.concat(stack.cards));
                    destroyStack(stack.id);
                    // stacks = stacks.filter(x => x.id != stack.id);
                }
            }
        }
    }

    Game.send(toSend);
}

let instantiateStack = (cards, pos, faceDown = false, foreign = false) => {
    const s = new Stack(cards, pos, faceDown);
    stacks.push(s);

    if(!foreign)
        toSend = { 
            ...toSend, 
            cardInstantiated: {
                cards: cards,
                pos: pos,
                faceDown: faceDown
            }
        };

    return s;
}

let destroyStack = (id, foreign = false) => {
    stacks = stacks.filter(x => x.id != id);
    if(!foreign)
        toSend = {
            ...toSend,
            stackDestroyed: id
        };
}

Game.onInit = canvas => {

    sprites.handOpen = Graphics.loadImage("res/images/hand_open.png");
    sprites.handClosed = Graphics.loadImage("res/images/hand_closed.png");

    sprites.card_rh1 = Graphics.loadImage("res/images/card_rh1.png");
    sprites.card_rh2 = Graphics.loadImage("res/images/card_rh2.png");
    sprites.card_rh3 = Graphics.loadImage("res/images/card_rh3.png");

    sprites.card_back = Graphics.loadImage("res/images/card_back.png");
    sprites.shadow = Graphics.loadImage("res/images/shadow.png");

    Game.canvasEvent("mousemove", e => {
        selfMousePos = Util.getMousePos(canvas, e);
    });

    Game.canvasEvent("mousedown", onMouseDown);

    Game.canvasEvent("mouseup", onMouseUp);

    s = new Stack([ "rh1", "rh2", "rh3" ], { x: 10, y: 10} );
    stacks.push(s);
}

Game.tick = (dt, g) => {
    Graphics.clear(g, "green");

    if(otherMousePos) {
        if(!otherMousePosSmooth)
            otherMousePosSmooth = otherMousePos;

        otherMousePosSmooth = Util.vecLerp(otherMousePosSmooth, otherMousePos, 5.0 * dt);
    }

    for (const stack of stacks) {
        stack.update(dt);
        if(!stack.isSelfDragging && !stack.isOtherDragging)
            stack.draw(g);
    }

    const draggingStacks = stacks.filter(x => x.isSelfDragging || x.isOtherDragging);
    for (const stack of draggingStacks) {
        stack.draw(g);
    }

    if(otherMousePosSmooth) {
        let handSprite = otherMouseDown? sprites.handClosed : sprites.handOpen;
        g.drawImage(handSprite, otherMousePosSmooth.x, otherMousePosSmooth.y, handSprite.width, handSprite.height);
    }

    // s.update(dt);
    // s.draw(g);
}

Game.netReceive = data => {
    otherMousePos = data.mousePos || otherMousePos;
    otherMouseDown = data.mouseDown === undefined? otherMouseDown : data.mouseDown;

    if(data.stackDestroyed) {
        destroyStack(data.stackDestroyed, true);
    }

    if(data.updateStackCards) {
        const found = stacks.find(x => x.id == data.updateStackCards.id);
        if(found)
            found.updateCards(data.updateStackCards.cards, true);
        console.log("WOWOWOW");
    }

    if(data.cardInstantiated) {
        instantiateStack(
            data.cardInstantiated.cards, 
            data.cardInstantiated.pos, 
            data.cardInstantiated.faceDown,
            true);
    }

    if(data.begunDrag) {
        const found = stacks.find(x => x.id == data.begunDrag);
        // console.log(data.begunDrag)
        if(found) found.beginDrag(true);
    }
    
    if(data.endedDrag) {
        const found = stacks.find(x => x.id == data.endedDrag.id);
        if(found) {
            found.endDrag(true);
            found.pos = data.endedDrag.finalPos;
        }
        // console.log(data.endedDrag);
    }

    // if(data.begunDrag)
    //     console.log(data);
}

Game.netTick = dt => {
    Game.send({
        mousePos: selfMousePos
    });
}