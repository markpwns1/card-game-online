const CONTEXT_MENU_WIDTH = 150;
const CONTEXT_MENU_ITEM_HEIGHT = 25;

const CARD_WIDTH = 88;
const CARD_HEIGHT = 120;

const CARD_BACK_SPRITE = "cardBack_red4.png";
const HAND_OPEN_SPRITE = "hand_open.png";
const HAND_CLOSED_SPRITE = "hand_closed.png";
const CARD_SHADOW_SPRITE = "shadow.png";

const MESSAGE_DURATION = 3.0;

// const sprites = { };

let selfMousePos;

let otherMousePos;
let otherMousePosSmooth;
let otherMouseDown = false;

let leftMouseDown = false;
let middleMouseDown = false;
let rightMouseDown = false;

const contextMenuShuffle = (stack) => {
    Util.shuffle(stack.cards);
    stack.updateCards(stack.cards);
}

const contextMenuReverse = (stack) => {
    stack.updateCards(stack.cards.reverse());
}

const cards = [
    "rh1", "rh2", "rh3"
];

let stacks = [ ];

let stackIDCounter = 0;

let eventMessages = [
    { text: "Other player shuffled that stack! 3", timeLeft: 3.0 },
    { text: "Other player shuffled that stack! 2", timeLeft: 2.0 },
    { text: "Other player shuffled that stack! 1", timeLeft: 1.0 },
];

class Stack {
    id = -1;
    cards = [ ];
    pos = { x: 0, y: 0 };
    size = { x: CARD_WIDTH, y: CARD_HEIGHT };
    isFaceDown = false;
    cardVerticality = 5;

    dragOffset = { x: 0, y: 0 };
    isSelfDragging = false;
    isOtherDragging = false;

    contextMenuOtherOpen = false;
    contextMenuSelfOpen = false;
    contextMenuPos = { x: 0, y: 0 };
    contextMenuItems = [
        { text: "Shuffle", message: "The other player shuffled that stack", action: contextMenuShuffle },
        { text: "Reverse", message: "The other player reversed that stack", action: contextMenuReverse },
    ];

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
        return {
            x: this.pos.x, 
            y: this.pos.y, 
            width: this.size.x, 
            height: this.size.y + (this.cards.length - 1) * this.cardVerticality 
        };
    }

    getTopCardRect() {
        return  { 
            x: this.pos.x, 
            y: this.pos.y + (this.cards.length - 1) * this.cardVerticality, 
            width: this.size.x, 
            height: this.size.y 
        };
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
            g.drawImage(Sprites.get(CARD_SHADOW_SPRITE), this.pos.x + 10, this.pos.y + 10, this.size.x, this.size.y + (this.cards.length - 1) * this.cardVerticality);
        }

        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            const sprite = Sprites.get(this.isFaceDown? CARD_BACK_SPRITE : (card + ".png"));
            // if(!sprite) {
            //     console.log(card);
            //     return;
            // }
            // console.log(sprite);
            g.drawImage(sprite, this.pos.x, this.pos.y + i * this.cardVerticality, this.size.x, this.size.y);
        }
    }

    openContextMenu(position, foreign = false) {
        this.contextMenuPos = { ...position };

        if(foreign) {
            this.contextMenuOtherOpen = true;
        }
        else {
            this.contextMenuSelfOpen = true;
            toSend = {
                ...toSend,
                contextMenuOpened: {
                    id: this.id,
                    pos: position
                }
            };
        }
    }

    closeContextMenu(foreign = false) {
        if(foreign) {
            this.contextMenuOtherOpen = false;
        }
        else {
            this.contextMenuSelfOpen = false;
            toSend = {
                ...toSend,
                contextMenuClosed: this.id
            };
        }
    }

    drawContextMenu(g) {
        if(!this.contextMenuSelfOpen && !this.contextMenuOtherOpen) return;

        const size = this.contextMenuOtherOpen? CONTEXT_MENU_ITEM_HEIGHT : (CONTEXT_MENU_ITEM_HEIGHT * Math.max(1, this.contextMenuItems.length));

        g.fillStyle = "black";
        g.beginPath();
        g.rect(this.contextMenuPos.x, this.contextMenuPos.y, CONTEXT_MENU_WIDTH, size);
        g.stroke();

        g.fillStyle = "rgb(200, 200, 200)";
        g.fillRect(this.contextMenuPos.x, this.contextMenuPos.y, CONTEXT_MENU_WIDTH, size);
            
        g.textAlign = "left";

        if(this.contextMenuSelfOpen) {
            if(this.contextMenuItems.length <= 0) {
                g.font = "12px Arial";
                g.fillText("(None)", this.contextMenuPos.x + 5, this.contextMenuPos.y + CONTEXT_MENU_ITEM_HEIGHT / 2); 
                return;
            }

            for (let i = 0; i < this.contextMenuItems.length; i++) {
                const item = this.contextMenuItems[i];
                const y = this.contextMenuPos.y + CONTEXT_MENU_ITEM_HEIGHT * i;

                const rect = { 
                    x: this.contextMenuPos.x, 
                    y: y, 
                    width: CONTEXT_MENU_WIDTH, 
                    height: CONTEXT_MENU_ITEM_HEIGHT
                };

                g.textBaseline = "middle"; 
                if(Util.pointInRect(selfMousePos, rect)) {
                    g.fillStyle = "gray";
                    g.fillRect(rect.x, rect.y, rect.width, rect.height);
                    g.fillStyle = "white";
                }
                else {
                    g.fillStyle = "black";
                }

                g.font = "12px Arial";
                g.fillText(item.text, this.contextMenuPos.x + 5, y + CONTEXT_MENU_ITEM_HEIGHT / 2); 
            }
        }
        else if(this.contextMenuOtherOpen) {
            g.textBaseline = "middle"; 
            g.fillStyle = "black";
            g.font = "12px Arial";
            g.fillText("(Opponent is interacting)", this.contextMenuPos.x + 5, this.contextMenuPos.y + CONTEXT_MENU_ITEM_HEIGHT / 2); 
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
        this.pos = { x: this.pos.x - 10, y: this.pos.y - 10 };

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
        stacks = stacks.filter(x => x.id != this.id);
        stacks.unshift(this);
        if(foreign) {
            this.isOtherDragging = false;
        }
        else {
            this.isSelfDragging = false;
            this.pos = { x: this.pos.x + 10, y: this.pos.y + 10 };
            // this.pos.x = Math.floor(this.pos.x / (10 + CARD_WIDTH)) * (10 + CARD_WIDTH) + 10;
            // this.pos.y = Math.floor(this.pos.y / (10 + CARD_HEIGHT)) * (10 + CARD_HEIGHT) + 10;

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
        if(stack.contextMenuOtherOpen || stack.isOtherDragging) continue;
        
        let shouldBreak = false;
        if(stack.contextMenuSelfOpen) {
            for (let i = 0; i < stack.contextMenuItems.length; i++) {
                const item = stack.contextMenuItems[i];
                const y = stack.contextMenuPos.y + CONTEXT_MENU_ITEM_HEIGHT * i;

                const rect = { 
                    x: stack.contextMenuPos.x, 
                    y: y, 
                    width: CONTEXT_MENU_WIDTH, 
                    height: CONTEXT_MENU_ITEM_HEIGHT
                };

                if(Util.pointInRect(selfMousePos, rect)) {
                    if(item.message)
                        toSend = { ...toSend, eventMessage: item.message }
                    item.action(stack);
                    shouldBreak = true;
                    break;
                }
            }
        }
        
        if(stack.contextMenuSelfOpen)
            stack.closeContextMenu();

        if(shouldBreak) break;

        if(!Util.pointInRect(selfMousePos, stack.getRect())) continue;

        // if(!stack.isOtherDragging && e.button == 2) {
        //     stack.isFaceDown = !stack.isFaceDown;
        // } 
        // else 
        if(e.button == 0 || (e.button == 1 && stack.cards.length == 1)) {
            stack.beginDrag();
            break;
        }
        else if(e.button == 1 && Util.pointInRect(selfMousePos, stack.getTopCardRect())) {
            const card = stack.cards.pop();
            stack.updateCards(stack.cards);
            // const newStack = new Stack(card, { ...stack.pos }, stack.isFaceDown);
            // stacks.push(newStack);
            const newStack = instantiateStack([ card ], { ...stack.getTopCardRect() })
            // stack.endDrag();
            newStack.beginDrag();
            break;
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

                if(Util.dist(stack.pos, otherStack.getTopCardRect()) < 50) {
                    otherStack.updateCards(otherStack.cards.concat(stack.cards));
                    destroyStack(stack.id);
                    // stacks = stacks.filter(x => x.id != stack.id);
                }
            }
        }
        else if(e.button == 2 && !stack.isOtherDragging && !stack.contextMenuOtherOpen && Util.pointInRect(selfMousePos, stack.getRect())) {
            stack.openContextMenu(selfMousePos);
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

    // sprites.handOpen = Sprites.get("hand_open.png");
    // sprites.handClosed = Sprites.get("hand_closed.png");

    // sprites.card_back = Sprites.get("cardBack_red4.png");
    // sprites.shadow = Sprites.get("shadow.png");

    // sprites.

    Game.canvasEvent("mousemove", e => {
        selfMousePos = Util.getMousePos(canvas, e);
    });

    Game.canvasEvent("mousedown", onMouseDown);

    Game.canvasEvent("mouseup", onMouseUp);

    // s = new Stack(Hearts, { x: 10, y: 10} );
    // stacks.push(s);

    instantiateStack(Util.CARDS_CLUBS, { x: 10, y: 10 }, false, true);
    instantiateStack(Util.CARDS_DIAMONDS, { x: 10 + (10 + CARD_WIDTH) * 1, y: 10 }, false, true);
    instantiateStack(Util.CARDS_HEARTS, { x: 10 + (10 + CARD_WIDTH) * 2, y: 10 }, false, true);
    instantiateStack(Util.CARDS_SPADES, { x: 10 + (10 + CARD_WIDTH) * 3, y: 10 }, false, true);
}

Game.tick = (dt, g) => {
    Graphics.clear(g, "green");

    if(otherMousePos) {
        if(!otherMousePosSmooth)
            otherMousePosSmooth = otherMousePos;

        otherMousePosSmooth = Util.vecLerp(otherMousePosSmooth, otherMousePos, 5.0 * dt);
    }

    for (let i = stacks.length - 1; i >= 0; i--) {
        const stack = stacks[i];
        stack.update(dt);
        if(!stack.isSelfDragging && !stack.isOtherDragging)
            stack.draw(g);
    }

    const draggingStacks = stacks.filter(x => x.isSelfDragging || x.isOtherDragging);
    for (const stack of draggingStacks) {
        stack.draw(g);
    }

    if(otherMousePosSmooth) {
        let handSprite = Sprites.get(otherMouseDown? HAND_CLOSED_SPRITE : HAND_OPEN_SPRITE);
        g.drawImage(handSprite, otherMousePosSmooth.x - handSprite.width / 2, otherMousePosSmooth.y - handSprite.height / 2, handSprite.width, handSprite.height);
    }

    for (const stack of stacks) {
        stack.drawContextMenu(g);
    }

    for (let i = 0; i < eventMessages.length; i++) {
        const msg = eventMessages[i];
        g.fillStyle = "rgba(255, 255, 0, " + (msg.timeLeft / MESSAGE_DURATION) + ")";
        g.font = "14px Arial";
        g.textAlign = "right";
        g.textBaseline = "bottom";
        g.fillText(msg.text, Game.WIDTH - 10, Game.HEIGHT - i * 20 - 10);
        msg.timeLeft -= dt;
        if(msg.timeLeft <= 0) {
            eventMessages = eventMessages.filter(x => x.timeLeft > 0);
        }
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
        if(found) found.beginDrag(true);
    }
    
    if(data.endedDrag) {
        const found = stacks.find(x => x.id == data.endedDrag.id);
        if(found) {
            found.endDrag(true);
            found.pos = data.endedDrag.finalPos;
        }
    }

    if(data.contextMenuOpened) {
        const found = stacks.find(x => x.id == data.contextMenuOpened.id);
        if(found) found.openContextMenu(data.contextMenuOpened.pos, true);
    }

    if(data.contextMenuClosed) {
        const found = stacks.find(x => x.id == data.contextMenuClosed);
        if(found) found.closeContextMenu(true);
    }

    if(data.eventMessage) {
        eventMessages.unshift({ text: data.eventMessage, timeLeft: MESSAGE_DURATION });
    }

}

Game.netTick = dt => {
    Game.send({
        mousePos: selfMousePos
    });
}