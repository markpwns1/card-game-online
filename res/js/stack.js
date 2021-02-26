
// "Shuffle" in the context menu
const contextMenuShuffle = (stack) => {
    stack.shuffle();
}

// "Reverse" in the context menu
const contextMenuReverse = (stack) => {
    stack.updateCards(stack.cards.reverse());
}

// "Flip" in the context menu
const contextMenuFlip = (stack) => {
    stack.setFaceDown(!stack.isFaceDown);
}

// "Take Half" in the context menu
const contextMenuTakeHalf = (stack) => {
    if(stack.cards.length < 2) return;

    let newStack = stack.separate(Math.ceil(stack.cards.length / 2));
    newStack.beginDrag();
}

var CardStacks = { 
    active: [ ], // READONLY. All stacks that are currently active
    defaultContextMenuItems: [
        { text: "Shuffle", message: "The other player shuffled that stack", action: contextMenuShuffle },
        { text: "Reverse", message: "The other player reversed that stack", action: contextMenuReverse },
        { text: "Flip", message: "The other player has flipped that stack", action: contextMenuFlip },
        { text: "Take Half", message: "The other player has taken half of that stack", action: contextMenuTakeHalf }
    ]
};

// Deletes all cards and resets things as though it were the first time
// loading the game
CardStacks.reset = () => {
    CardStacks.active = [ ];
    stackIDCounter = 0;
}

// Returns true if a context menu item was clicked
CardStacks.interactWithContextMenus = () => {
    let itemClicked = false;
    for (const stack of CardStacks.active) {
        
        if(stack.contextMenuOtherOpen || stack.isOtherDragging) continue;
        
        if(stack.contextMenuSelfOpen) {
            for (let i = 0; i < stack.contextMenuItems.length; i++) {
                const item = stack.contextMenuItems[i];
                const y = stack._contextMenuPos.y + GAME_INFO.contextMenuItemHeight * i;

                const rect = { 
                    x: stack._contextMenuPos.x, 
                    y: y, 
                    width: GAME_INFO.contextMenuWidth, 
                    height: GAME_INFO.contextMenuItemHeight
                };

                if(Util.pointInRect(Game.selfMousePos, rect)) {
                    if(item.message)
                        // toSend = { ...toSend, eventMessage: item.message }
                        NetworkBuffer.addOne("eventMessage", item.message);
                    item.action(stack);
                    itemClicked = true;
                    break;
                }
            }
        }

        if(stack.contextMenuSelfOpen)
            stack.closeContextMenu();

        if(itemClicked) return true;
    }

    return false;
}

// Receives network events for all built-in interactions like dragging or opening
// the context menu
CardStacks.receiveNetworkEvents = data => {
    if(data.stackDestroyed) {
        CardStacks.destroy(data.stackDestroyed, true);
    }

    if(data.stackPosSet) {
        const found = CardStacks.find(data.stackPosSet.id);
        if(found)
            found.setPos(data.stackPosSet.pos, true);
    }

    if(data.updateStackCards) {
        const found = CardStacks.find(data.updateStackCards.id);
        if(found)
            found.updateCards(data.updateStackCards.cards, true);
    }

    if(data.cardInstantiated) {
        CardStacks.instantiate(
            data.cardInstantiated.cards, 
            data.cardInstantiated.pos, 
            data.cardInstantiated.faceDown,
            true);
    }

    if(data.begunDrag) {
        const found = CardStacks.find(data.begunDrag);
        if(found) found.beginDrag(true);
    }
    
    if(data.endedDrag) {
        const found = CardStacks.find(data.endedDrag.id);
        if(found) {
            found.pos = data.endedDrag.finalPos;
            found.endDrag(true);
        }
    }

    if(data.contextMenuOpened) {
        const found = CardStacks.find(data.contextMenuOpened.id);
        if(found) found.openContextMenu(data.contextMenuOpened.pos, true);
    }

    if(data.contextMenuClosed) {
        const found = CardStacks.find(data.contextMenuClosed);
        if(found) found.closeContextMenu(true);
    }

    if(data.setFaceDown) {
        const found = CardStacks.find(data.setFaceDown.id);
        if(found) found.setFaceDown(data.setFaceDown.isFaceDown);
    }
};

// Finds a stack by ID
CardStacks.find = id => CardStacks.active.find(x => x.id == id);

// Removes a stack from the game. This operation is synced across both clients
CardStacks.destroy = (id, foreign = false) => {
    CardStacks.active = CardStacks.active.filter(x => x.id != id);
    if(!foreign)
        NetworkBuffer.addOne("stackDestroyed", id);
};

// Adds a new stack to the game. This operation is synced across both clients
CardStacks.instantiate = (cards, pos, faceDown = false, foreign = false) => {
    const s = new CardStack(cards, pos, faceDown);
    CardStacks.active.push(s);

    if(!foreign)
        NetworkBuffer.addOne("cardInstantiated", {
            cards: cards,
            pos: pos,
            faceDown: faceDown
        });

    return s;
};

// Update all stacks
CardStacks.updateAll = dt => {
    for (let i = CardStacks.active.length - 1; i >= 0; i--) {
        CardStacks.active[i].update(dt);
    }
};

// Draw all stacks
CardStacks.drawAll = g => {
    // First draw the stacks that aren't being dragged
    for (let i = CardStacks.active.length - 1; i >= 0; i--) {
        const stack = CardStacks.active[i];
        if(!stack.isSelfDragging && !stack.isOtherDragging)
            stack.draw(g);
    }

    // Then draw the ones being dragged on top
    const draggingStacks = CardStacks.active.filter(x => x.isSelfDragging || x.isOtherDragging);
    for (const stack of draggingStacks) {
        stack.draw(g);
    }
};

// Draws the context menus of all stacks
CardStacks.drawAllContextMenus = g => {
    for (const stack of CardStacks.active) {
        stack.drawContextMenu(g);
    }
};

let stackIDCounter = 0;

class CardStack {
    id = -1; // READONLY. The stack's unique ID
    cards = [ ]; // READONLY. List of cards in the stack

    // Self-explanatory
    pos = { x: 0, y: 0 }; // READONLY
    size = { x: GAME_INFO.defaultCardWidth, y: GAME_INFO.defaultCardHeight };

    isFaceDown = false; // READONLY. Whether this stack is face-down or not

    // Whether this stack will appear face-down for the client, regardless of isFaceDown
    isHidden = false; 

    // How many pixels in the Y direction each card in this stack is separated by.
    // A stack of cards with all 52 cards and cardVerticality = 0 is functionally a
    // deck of cards.
    cardVerticality = 5;

    // READONLY. Whether this card is being dragged by the client, or by the other player, respectively
    isSelfDragging = false;
    isOtherDragging = false;

    // READONLY. Whether this card's context menu is opened by the client or the other player.
    contextMenuSelfOpen = false;
    contextMenuOtherOpen = false;

    // Context menu items
    contextMenuItems = CardStacks.defaultContextMenuItems;

    // Private fields
    _dragOffset = { x: 0, y: 0 };
    _contextMenuPos = { x: 0, y: 0 };

    constructor(cards, pos, faceDown = false) {
        this.cards = [ ...cards ];
        this.pos = pos;
        this.isFaceDown = faceDown;
        this.id = ++stackIDCounter;
    }

    // Returns the topmost card in the stack
    getTop() {
        return this.cards[this.cards.length - 1];
    }

    // Returns this stack's bounding box
    getRect() {
        return {
            x: this.pos.x, 
            y: this.pos.y, 
            width: this.size.x, 
            height: this.size.y + (this.cards.length - 1) * this.cardVerticality 
        };
    }

    // Returns the bounding box of the topmost card in the stack
    getTopCardRect() {
        return  { 
            x: this.pos.x, 
            y: this.pos.y + (this.cards.length - 1) * this.cardVerticality, 
            width: this.size.x, 
            height: this.size.y 
        };
    }

    // Runs every frame, meant for updating the stack
    update(dt) {
        if(this.isSelfDragging) {
            this.pos = { x: Game.selfMousePos.x + this._dragOffset.x, y: Game.selfMousePos.y + this._dragOffset.y };
        }
        else if(this.isOtherDragging) {
            this.pos = { 
                x: Game.otherMousePosSmooth.x + this._dragOffset.x, 
                y: Game.otherMousePosSmooth.y + this._dragOffset.y 
            };
        }
    }

    // Runs every frame, meant for drawing the stack
    draw(g) {
        if(this.isSelfDragging || this.isOtherDragging) {
            g.drawImage(Sprites.get(GAME_INFO.cardShadowSprite), this.pos.x + 10, this.pos.y + 10, this.size.x, this.size.y + (this.cards.length - 1) * this.cardVerticality);
        }

        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i];
            const sprite = Sprites.get((this.isFaceDown || this.isHidden)? GAME_INFO.cardBackSprite : (card + ".png"));
            
            g.drawImage(sprite, this.pos.x, this.pos.y + i * this.cardVerticality, this.size.x, this.size.y);
        }
    }

    // Opens the stack's context menu
    openContextMenu(position, foreign = false) {
        this._contextMenuPos = { ...position };

        if(foreign) {
            this.contextMenuOtherOpen = true;
        }
        else {
            this.contextMenuSelfOpen = true;
            NetworkBuffer.addOne("contextMenuOpened", {
                id: this.id,
                pos: position
            });
        }
    }

    // Closes the stack's context menu
    closeContextMenu(foreign = false) {
        if(foreign) {
            this.contextMenuOtherOpen = false;
        }
        else {
            this.contextMenuSelfOpen = false;
            NetworkBuffer.addOne("contextMenuClosed", this.id);
        }
    }

    // Sets whether or not the stack is face down
    setFaceDown(f, foreign = false) {
        this.isFaceDown = f
        if(!foreign)
            NetworkBuffer.addOne("setFaceDown", {
                id: this.id,
                isFaceDown: f
            });
    }

    // Draws the stack's context menu
    drawContextMenu(g) {
        if(!this.contextMenuSelfOpen && !this.contextMenuOtherOpen) return;

        const size = this.contextMenuOtherOpen? GAME_INFO.contextMenuItemHeight : (GAME_INFO.contextMenuItemHeight * Math.max(1, this.contextMenuItems.length));

        g.fillStyle = "black";
        g.beginPath();
        g.rect(this._contextMenuPos.x, this._contextMenuPos.y, GAME_INFO.contextMenuWidth, size);
        g.stroke();

        g.fillStyle = "rgb(200, 200, 200)";
        g.fillRect(this._contextMenuPos.x, this._contextMenuPos.y, GAME_INFO.contextMenuWidth, size);
            
        g.textAlign = "left";

        if(this.contextMenuSelfOpen) {
            if(this.contextMenuItems.length <= 0) {
                g.font = "12px Arial";
                g.fillText("(None)", this._contextMenuPos.x + 5, this._contextMenuPos.y + GAME_INFO.contextMenuItemHeight / 2); 
                return;
            }

            for (let i = 0; i < this.contextMenuItems.length; i++) {
                const item = this.contextMenuItems[i];
                const y = this._contextMenuPos.y + GAME_INFO.contextMenuItemHeight * i;

                const rect = { 
                    x: this._contextMenuPos.x, 
                    y: y, 
                    width: GAME_INFO.contextMenuWidth, 
                    height: GAME_INFO.contextMenuItemHeight
                };

                g.textBaseline = "middle"; 
                if(Util.pointInRect(Game.selfMousePos, rect)) {
                    g.fillStyle = "gray";
                    g.fillRect(rect.x, rect.y, rect.width, rect.height);
                    g.fillStyle = "white";
                }
                else {
                    g.fillStyle = "black";
                }

                g.font = "12px Arial";
                g.fillText(item.text, this._contextMenuPos.x + 5, y + GAME_INFO.contextMenuItemHeight / 2); 
            }
        }
        else if(this.contextMenuOtherOpen) {
            g.textBaseline = "middle"; 
            g.fillStyle = "black";
            g.font = "12px Arial";
            g.fillText("(Opponent is interacting)", this._contextMenuPos.x + 5, this._contextMenuPos.y + GAME_INFO.contextMenuItemHeight / 2); 
        }
    }

    // Sets the stack's cards
    updateCards(cards, foreign = false) {
        this.cards = cards;
        if(!foreign)
            NetworkBuffer.addOne("updateStackCards", {
                id: this.id,
                cards: cards
            });
    }

    // Begins dragging the stack
    beginDrag(foreign = false) {
        this.pos = { x: this.pos.x - 10, y: this.pos.y - 10 };

        if(foreign) {
            this.isOtherDragging = true;

            this._dragOffset = { 
                x: this.pos.x - Game.otherMousePosSmooth.x, 
                y: this.pos.y - Game.otherMousePosSmooth.y 
            };
        }    
        else {
            this.isSelfDragging = true;

            this._dragOffset = { 
                x: this.pos.x - Game.selfMousePos.x, 
                y: this.pos.y - Game.selfMousePos.y 
            };

            NetworkBuffer.addOne("begunDrag", this.id);
        }
    }

    // Stops dragging the stack
    endDrag(foreign = false) {
        CardStacks.active = CardStacks.active.filter(x => x.id != this.id);
        CardStacks.active.unshift(this);
        
        if(foreign) {
            this.isOtherDragging = false;
        }
        else {
            this.isSelfDragging = false;
            this.pos = { x: this.pos.x + 10, y: this.pos.y + 10 };

            NetworkBuffer.addOne("endedDrag", {
                id: this.id,
                finalPos: this.pos
            });
        }

        this.updateEffectAreaInfluence();
    }

    // Updates the effect areas that are influencing this card
    updateEffectAreaInfluence() {
        for (const effectArea of EffectAreas.active) {
            if(Util.intersectsAABB(this.getRect(), effectArea.getRect())) {
                effectArea.cardsContained.push(this);
                effectArea.onStackEnter(this);
            }
            else if(effectArea.cardsContained.find(x => x.id == this.id)) {
                effectArea.cardsContained = effectArea.cardsContained.filter(x => x.id != this.id);
                effectArea.onStackExit(this);
            }
        }
    }

    // Takes N number of cards from the top of this stack and makes it into its own stack.
    // This operation is synced across both clients.
    separate(amount) {
        const keptCards = this.cards.slice(0, this.cards.length - amount);
        const takenCards = this.cards.slice(this.cards.length - amount);
        this.updateCards(keptCards);
        const newStack = CardStacks.instantiate(takenCards, { ...this.getTopCardRect() }, this.isFaceDown);
        return newStack;
    }

    // Places "otherStack" on top of this stack. This operation is synced across both clients
    combine(otherStack) {
        this.updateCards(this.cards.concat(otherStack.cards));
        CardStacks.destroy(otherStack.id);
    }

    // Shuffles this stacks cards. This operation is synced across both clients
    shuffle() {
        Util.shuffle(this.cards);
        this.updateCards(this.cards);
    }

    // Set's a card's position. This operation is synced across clients
    setPos(pos, foreign = false) {
        this.pos = { x: Math.round(pos.x), y: Math.round(pos.y) };
        if(!foreign)
            NetworkBuffer.addOne("stackPosSet", {
                id: this.id,
                pos: pos
            });
    }

    // Returns true if the mouse is currently over this stack's bounding box
    isHovering() {
        return Util.pointInRect(Game.selfMousePos, this.getRect());
    }

    // Returns true if the mouse is currently over the bounding box of 
    // this stack's topmost card
    isHoveringTopmostCard() {
        return Util.pointInRect(Game.selfMousePos, this.getRect());
    }

    // Self explanatory
    isOccupiedByOtherPlayer() {
        return this.isOtherDragging || this.contextMenuOtherOpen;
    }
}