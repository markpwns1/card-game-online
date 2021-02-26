
const LEFT_MOUSE_BUTTON = 0;
const MIDDLE_MOUSE_BUTTON = 1;
const RIGHT_MOUSE_BUTTON = 2;

const HAND_OPEN_SPRITE = "hand_open.png";
const HAND_CLOSED_SPRITE = "hand_closed.png";

// Sample context menu item to move a stack to the center of the board
CardStacks.defaultContextMenuItems.push({
    text: "Move to Center",
    message: "The other player has moved that stack to the center",
    action: stack => {
        stack.setPos({ 
            x: GAME_INFO.gameWidth / 2 - stack.size.x / 2, 
            y: GAME_INFO.gameHeight / 2 - stack.size.y / 2 
        });
    }
});

let otherMouseDown = false;

let onMouseDown = e => {

    Game.selfMousePos = Util.browserToCanvasCoords(Game.canvas, e);

    // Make sure the network buffer is empty before beginning the mousedown operation
    // (this will save a lot of headaches in the future)
    NetworkBuffer.assertEmpty();
    NetworkBuffer.addOne("mousePos", {
        pos: Game.selfMousePos,
        immediate: true
    });

    // If the left or middle mouse buttons are down, send a message to the other client
    // saying that it should display the "fist" sprite 
    if(e.button == LEFT_MOUSE_BUTTON || e.button == MIDDLE_MOUSE_BUTTON)
        NetworkBuffer.addOne("mouseDown", true);

    // Try to interact with any open context menus, and only allow card dragging
    // if we didn't click on any context menu items
    const canDrag = !CardStacks.interactWithContextMenus();
    if(canDrag) {

        // For each card stack...
        for (const stack of CardStacks.active) {

            // If the mouse isn't over the card stack or if this stack is being
            // used by the other player, continue
            if(!stack.isHovering() || stack.isOccupiedByOtherPlayer()) continue;

            // Otherwise, if the stack is being left clicked (or middle-clicked but it's only 1 card)...
            if(e.button == LEFT_MOUSE_BUTTON || (e.button == MIDDLE_MOUSE_BUTTON && stack.cards.length == 1)) {
                // Begin dragging this stack
                stack.beginDrag();
                break;
            }

            // Otherwise if the stack is being middle clicked and the mouse is over the 
            // top-most card...
            else if(e.button == MIDDLE_MOUSE_BUTTON && stack.isHoveringTopmostCard()) {
                // Take the topmost card from the stack and begin dragging it
                const newStack = stack.separate(1);
                newStack.beginDrag();
                break;
            }
        }
    }

    // Having completed the mousedown operation, send everything to the other client
    NetworkBuffer.send();
};

let onMouseUp = e => {
    // Make sure the network buffer is empty before beginning the mousedown operation
    NetworkBuffer.assertEmpty();

    // If the left or middle mouse buttons have been released, send a message to the 
    // other client saying that it should display the "hand spead out" sprite 
    if(e.button == LEFT_MOUSE_BUTTON || e.button == MIDDLE_MOUSE_BUTTON)
        NetworkBuffer.addOne("mouseDown", false);

    // For each card stack...
    for (const stack of CardStacks.active) {
        
        // If the card stack is being dragged, and if the left mouse button is being
        // released (or the middle mouse button if the stack is just one card)...
        if(stack.isSelfDragging && (e.button == LEFT_MOUSE_BUTTON || (e.button == MIDDLE_MOUSE_BUTTON && stack.cards.length == 1))) {
            
            // Stop dragging the stack
            stack.endDrag();

            // For every *other* stack of cards...
            for (const otherStack of CardStacks.active) {
                if(stack == otherStack) continue;

                // If the stack that was being dragged is close enough to this
                // stack, combine the stacks together
                if(Util.dist(stack.pos, otherStack.getTopCardRect()) < 50) {
                    otherStack.combine(stack);
                    break;
                }
            }
        }

        // Otherwise if the right mouse button is the one that's being released,
        // and the mouse is currently over this stack, and this stack isn't being
        // used by the other player in any way, open the stack's context menu
        else if(e.button == RIGHT_MOUSE_BUTTON && !stack.isOccupiedByOtherPlayer() && stack.isHovering()) {
            stack.openContextMenu(Game.selfMousePos);
            break;
        }

    }

    // Having completed the mousedown operation, send everything to the other client
    NetworkBuffer.send();
}

let onKeyUp = e => {
    // If the R key has been released (after being pressed)...
    if(e.code == "KeyR" && GameNetwork.isHost) { 
        if(window.confirm("You are about to reset the game. Are you sure?")) {
            // Tell the other client to reset their game
            Game.send({
                resetGame: true
            });

            // And reset our own game
            Notifications.send("Game reset.");
            Game.reset(); 
        }
    }
}

// Since there are infinite possibilities of how to go about controlling a game
// on mobile (tap, double tap, tap and hold, tap with multiple fingers, etc.), I 
// will make no assumptions and have only written the bare minimum as a template, 
// (dragging cards around on mobile) and leave it up to the programmer.
// See onMouseDown and onMouseUp above for a straightforward example on how to
// manipulate stacks in response to input events.

let onTouchStart = e => { 
    // Prevent default mobile events
    e.preventDefault();
    e.stopImmediatePropagation();

    // Assume that the "mouse position" is the first touch point
    let touchPoint = Util.browserToCanvasCoords(Game.canvas, e.touches[0]);
    Game.selfMousePos = touchPoint;

    // Send our mouse position to the other client before dragging
    NetworkBuffer.assertEmpty();
    NetworkBuffer.addOne("mousePos", {
        pos: Game.selfMousePos,
        immediate: true
    });

    // For each stack...
    for (const stack of CardStacks.active) {
        // If the mouse isn't over the card stack, continue
        if(!stack.isHovering() || stack.isOccupiedByOtherPlayer()) continue;

        // If we're actually dragging, notify the other client that he should display the
        // "hand in a fist" sprite
        NetworkBuffer.addOne("mouseDown", true);

        // Begin dragging
        stack.beginDrag();
        break;
    }

    // Send all the network data to the other client
    NetworkBuffer.send();
};

let onTouchEnd = e => { 
    // Prevent default mobile events
    e.preventDefault();
    e.stopImmediatePropagation();

    // Make sure the network buffer is empty
    NetworkBuffer.assertEmpty();

    // Stop dragging any dragged stacks
    for (const stack of CardStacks.active) {
        if(stack.isSelfDragging)
            stack.endDrag();
    }
    
    // Tell the other client to use the "hand spread out" sprite
    NetworkBuffer.addOne("mouseDown", false);

    // Send all that info to the other client
    NetworkBuffer.send();
};

let onTouchMove = e => {
    // Prevent default mobile events
    e.preventDefault();
    e.stopImmediatePropagation();

    // Update our "mouse position" in response to any touches
    Game.selfMousePos = Util.browserToCanvasCoords(Game.canvas, e.touches[0]);
}

// Called exactly once before the game starts. Is only ever called once, ever.
Game.onInit = () => {

    // Subscribe to some canvas events. These are regular old canvas events 
    // that anyone can look up on W3Schools or Mozilla web docs
    Game.canvasEvent("mousedown", onMouseDown);
    Game.canvasEvent("mouseup", onMouseUp);
    Game.canvasEvent("touchstart", onTouchStart);
    Game.canvasEvent("touchmove", onTouchMove);
    Game.canvasEvent("touchend", onTouchEnd);

    // Listen for keypresses
    window.addEventListener('keyup', onKeyUp, false);

    // Create 2 effect areas, one for the host's hand and one for the guest's hand.
    // We'll make it so that cards inside the zone will only be visible to the zone's
    // owner.
    const hostHand = new EffectArea(GameNetwork.isHost? "Your hand" : "The other player's hand", 10, 10, Game.WIDTH - 20, 100);
    const guestHand = new EffectArea(GameNetwork.isHost? "The other player's hand" : "Your hand", 10, Game.HEIGHT - 110, Game.WIDTH - 20, 100);
    
    // If this client isn't the host, then hide cards that go here
    hostHand.onStackEnter = stack => {
        if(!GameNetwork.isHost) stack.isHidden = true;
    };

    // If this client isn't the guest, then hide cards that go here
    guestHand.onStackEnter = stack => {
        if(GameNetwork.isHost) stack.isHidden = true;
    };

    // Removing a card from the zone will no longer make it hidden
    const reveal = stack => { stack.isHidden = false; };
    guestHand.onStackExit = reveal;
    hostHand.onStackExit = reveal;

    // Register these effect areas
    EffectAreas.active.push(hostHand);
    EffectAreas.active.push(guestHand);

    // Arrange the board
    Game.reset();
}

// Called automatically every time the game board needs to be reset (including
// initial setup of the game board). Can also be called manually to reset
// the game arbitrarily
Game.reset = () => {
    CardStacks.reset(); // Delete all card stacks, if there are any

    // Place 4 stacks of cards side-by-side
    CardStacks.instantiate(Util.CARDS_CLUBS, { x: 10, y: 150 }, false, true);
    CardStacks.instantiate(Util.CARDS_DIAMONDS, { x: 10 + (10 + GAME_INFO.defaultCardWidth) * 1, y: 150 }, false, true);
    CardStacks.instantiate(Util.CARDS_HEARTS, { x: 10 + (10 + GAME_INFO.defaultCardWidth) * 2, y: 150 }, false, true);
    CardStacks.instantiate(Util.CARDS_SPADES, { x: 10 + (10 + GAME_INFO.defaultCardWidth) * 3, y: 150 }, false, true);
}

// Called automatically every frame
Game.tick = (dt, g) => {
    Graphics.clear(g, "green");

    // Update and draw effect areas
    EffectAreas.updateAll(dt);
    EffectAreas.drawAll(g);

    // Update and draw card stacks
    CardStacks.updateAll(dt);
    CardStacks.drawAll(g);

    // Draw the other player's mouse cursor
    let handSprite = Sprites.get(otherMouseDown? HAND_CLOSED_SPRITE : HAND_OPEN_SPRITE);
    g.drawImage(handSprite, Game.otherMousePosSmooth.x - handSprite.width / 2, Game.otherMousePosSmooth.y - handSprite.height / 2, handSprite.width, handSprite.height);

    // Draw context menus
    CardStacks.drawAllContextMenus(g);

    // Update and draw the messages at the bottom right
    Notifications.tick(dt, g);
}

// Called automatically whenever data is received from the other player
Game.netReceive = data => {

    // These are all required for built-in things like syncing card stacks,
    // effect areas, etc.
    Game.receiveOtherMousePos(data); // Receive the other player's mouse position
    Game.receiveResetEvent(data); // Receive the "reset game" event if it ever comes
    CardStacks.receiveNetworkEvents(data); // Receive all the events related to card stacks
    EffectAreas.receiveNetworkEvents(data); // Receive all the events related to effect areas
    Notifications.receiveMessages(data); // Receive any event messages 

    // Finally, some game-specific code which will update the other player's
    // "mouse down status" if "mouseDown" happens to be included in the data
    // we received
    otherMouseDown = data.mouseDown === undefined? otherMouseDown : data.mouseDown;
}

// Called automatically at GAME_INFO.networkTickrate times per second,
// the return value is what gets sent to the other player
Game.netTick = dt => {
    return {
        // Return some arbitrary JSON
    };
}