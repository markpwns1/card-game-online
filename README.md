# Card Game Template

This is a barebones multiplayer card game engine written in jQuery and Peer.js.

## Structure

`index.js` is where most, if not all DOM interaction is done, and where the DOM is modified. The code for the "join room" button is here, for instance. This file should not need to be edited unless you're going to edit the HTML, which should not be required for most games.

`index.js` calls on `network.js` to handle things like rooms and connecting to rooms, etc. `network.js` should **never** need to be edited under practically any circumstance, unless you want to change core room-joining logic. The `GameNetwork` object is defined in this file, which provides a thin abstraction over Peer.js. 

After a room has been connected to, `GameNetwork` signals to `index.js` to switch to the game screen, and also signals `Game` (defined in `game.js`) to begin the game. `Game` is essentially the core game-engine, and is quite barebones, handling only the game loop and network loop, and providing some abstraction over things like events and game-related netcode. It provides built-in functionality to track the other player's mouse/touch movements, if you so choose.

`Game` exposes a few events that your card game will hook into for game-specific code, like the game loop, network loop, initialisation, etc. Most of your game-specific code will be in `gamelogic.js`, and there is already a bare-bones game inside `gamelogic.js` that demonstates how you'd normally go about making a game.

Game-specific code will make use of helping classes such as `CardStack`, `EffectArea`, `Util`, `Graphics`, etc.

## Getting Started
To get started, simply clone the repo and modify `res/data/info.js` and `res/js/gamelogic.js`. Included in `gamelogic.js` is a sample game that you can use to build off of.
You can run a development server by running `node devserver.js`. You can use this to play with other devices without hosting it anywhere--ideal for development. Or you can simply double-click and open two tabs of `index.html`.

## Network Logic
Ten times a second by default, `Game.netTick` is called and you can return any JSON and the other client will receieve it as soon as he get it, in `Game.netReceive`. Alternatively, you can send messages to the other client whenever you want using `Game.send`. You should try to minimise the amount of network messages you send, so there is a helper object called `NetworkBuffer`. Call `NetworkBuffer.assertEmpty()` to make sure the buffer is empty, then call `NetworkBuffer.add()` exactly the same way as `Game.send()` (or use `NetworkBuffer.addOne` if you know how), and this will add data to the network buffer. Send it all at once when you're ready using `NetworkBuffer.send()`.

## Game Events
The game engine requires you to hook onto a few events. Put game-specific code here.
- `Game.onInit: () => void` - Called exactly once, when the game is starting. It is never called again after that, even after calling `Game.reset()`.
- `Game.reset: () => void` - Called whenever the other client sends `{ resetGame: true }`. Can also be called locally to reset the game. (Don't forget to send `{ resetGame: true }` to the other client to have him reset the game as well.)
- `Game.tick: (dt, g) => void` - The main game loop, called `targetFramerate` times per second.
- `Game.netReceive: (data: any) => void` - Receives data from the other client when he calls `Game.send()` or `NetworkBuffer.send()`. This function is called as soon as the data is received.
- `Game.netTick: () => any` - Called 10 times per second by default, return a JSON object to have it sent to the other client.

## In Detail

For the sake of brevity, while reading this documentation, keep in mind that any variable named `dt` (short for delta-time) is a `number` that represents the time in seconds between the current frame and the previous frame. Also, any variable named `g` is the `CanvasRenderingContext2D` to be used for rendering the current frame.

Furthermore, any parameter `foreign: boolean = false` of a method indicates whether the origin of this method call is from the other client. This is used to sync values between clients and suppress network messages if the local client is receiving this from the other client. 

Take `CardStack.setPos(pos: Point, foreign)` for example. `stack.setPos({ x: 10, y: 10 })` will set a stack's position, and also send a message to the other client notifying him of the card's new location. The other client, once he has received this message, will call `stack.setPos({ x: 10, y: 10 }, true)`--notice how `true` is passed as `foreign`. This will set the stack's position only on the client-side. If `foreign` were `false` it would simply send an identical message back and cause an infinite loop. When `foreign == true`, the network message is suppressed.

TL;DR when performing action that you want synchronised, set `foreign` to `false`, otherwise set it to `true`.

### Point, Vector, Size
This is not actually a class that is defined anywhere. It simply refers to any structure that is compatible with the following interface: 
```ts
{
    x: number;
    y: number;
}
```
Any kind of position or size or direction will be represented like this.

### Rect
This is likewise not a class defined anywhere. It refers to any structure that is compatible with the following interface: 
```ts
{
    x: number;
    y: number;
    width: number;
    height: number;
}
```

### ContextMenuItem
Once again, this is not a class defined anywhere, but instead a structure that is compatible with the following interface:
```ts
{
    text: string,
    message: string,
    action: (stack: CardStack) => void
}
```
Where `text` is the label for this item in the context menu, `message` is the message that gets sent to the other client when the local client clicks this item, and `action` is a callback for when this item is clicked, with the stack that was clicked as an argument.

### CardStack
- `constructor(cards: string[], pos: Point, faceDown: boolean)` - Instantiates a new `CardStack` with the aforementioned values. Note that this **does not** register the stack with the game engine, nor sync it across clients. Use `CardStacks.instantiate` to properly place a new stack onto the board.
- `id: number` - Readonly. Each card stack has a unique identifying ID.
- `cards: string[]` - Readonly. The cards that are contained in each stack. This should be a list of filenames **without the extension**. The extension is assumed to be .png. The stack will display the cards by displaying a sprite from `res/images` with the same name as each card. The order of these cards is such that `cards[0]` is the bottom-most card and `card[cards.length - 1]` is the topmost card.
- `pos: Point` - Readonly. Self explanatory.
- `size: Size` - This stack's size. Mutating this will only change it for the local client, not the other player. 
- `isFaceDown: boolean` - Readonly. Whether or not this stack is face-down. When this field is true, it will appear as face-down for both clients.
- `isHidden: boolean` - Whether or not this stack is face-down to the local client. When this is true, this stack will appear face-down to the local client, regardless of the value of `isFaceDown`. `isHidden` has no effect on the other client.
- `cardVerticality: number` - How many pixels in the Y direction each card in the stack is separated from the other cards. For example, if `cardVerticality` is a large number, then you'll be able to see the tops of every card in the stack, and the stack will appear very long. If `cardVerticality` is 0, then every card will be drawn on top of the last one, making the stack look like it's only 1 card. 
- `isSelfDragging: boolean` - Readonly. Whether or not this card is being dragged by the local client.
- `isOtherDragging: boolean` - Readonly. Whether or not this card is being dragged by the other client.
- `contextMenuSelfOpen: boolean` - Readonly. Whether or not this card's context menu is currently opened by the local client.
- `contextMenuOtherOpen: boolean` - Readonly. Whether or not this card's context menu is currently opened by the other client.
- `contextMenuitems: ContextMenuItem[]` - A list of the context menu items available in this card's context menu. Can be modified at any time, but is not synced across clients. This is to allow for things like different players being allowed to perform different actions.
- `update: (dt) => void` - Should be called once per frame to update this stack.
- `draw: (g) => void` - Should be called once per frame after `update` to draw this stack
- `drawContextMenu: (g) => void` - Should be called once per frame on each card after all the cards have been drawn. This method draws the card's context menu, if it's open. 
- `openContextMenu: (position: Point, foreign) => void` - Opens this stack's context menu, synced across both clients. If `foreign == true`, it will appear as though the other player is opening the context menu.
- `closeContextMenu: (foreign) => void` - Closes this stack's context menu, synced across both clients. If `foreign == true`, it will be as though the other player closed the context menu.
- `beginDrag: (foreign) => void` - Begins dragging this stack. While dragging, the stack will maintain its position relative to `Game.selfMousePos`. If `foreign == true`, it will be as though the other player started dragging this stack. In that case, it will maintain its position relative to `Game.otherMousePosSmooth`.
- `endDrag: (foreign) => void` - Stops dragging this stack. If the stack has been dragged into an effect area, the effect area will be notified. Likewise, if the stack was inside an effect area prior to being dragged, and is no longer in that effect area, the effect area will be notified that the stack has left.
- `updateEffectAreaInfluence: () => void` - If this stack is inside any effect area, the effect area will be notified, and if this stack is no longer inside an effect area, the effect area will be notified.
- `setPos: (pos: Point, foreign) => void` - Sets the position of this stack, synced across clients. Note that this function does not automatically update the stack's effect areas, use `updateEffectAreaInfluence()` after setting its position if you want to do that. If `foreign == true` then it will be as though the other player was the one who set this stack's position.
- `separate: (amount: number) => CardStack` - Takes `amount` number of cards from the top of the stack, removing it from this stack, makes it into its own stack, and returns it. This operation is synchronised between clients. 
- `combine: (other: CardStack) => void` - Takes all the cards from `other` and places them on top of this stack. Destroys `other`. This operation is synced between clients.
- `shuffle: () => void` - Shuffles this stack's cards. This operation is synced between clients.
- `getTop: () => string` - Returns the topmost card.
- `getRect: () => Rect` - Returns this stack's bounding box.
- `getTopCardRect: () => Rect` - Returns the bounding box of this stack's topmost card.
- `isHovering: () => boolean` - Returns true if the local client's mouse is currently hovering over the stack.
- `isHoveringTopmostCard: () => boolean` - Returns true if the local client's mouse is currently inside the topmost card's bounding box.
- `isOccupiedByOtherPlayer: () => boolean` - Returns true if the other player is dragging this stack or if the other player has this stack's context menu open.

### CardStacks
`CardStacks` is meant to deal with all the stacks in the game as a whole. It provides facilities for updating and drawing them all at once, among other things. `CardStacks` is a static class and not meant to be instantiated.
- `active: CardStack[]` - Readonly. A list of all the active stacks.
- `defaultContextMenuItems: ContextMenuItem[]` - A list of all the ContextMenuItems to give each stack by default. This will only apply to newly created `CardStack`s--not already created ones.
- `updateAll: (dt) => void` - Updates every stack.
- `drawAll: (g) => void` - Draws every stack. Should be called after `updateAll()` for best results.
- `drawAllContextMenus: (g) => void` - Draws every stack's context menu, if it's open. Should be called after `drawAll()`.
- `receiveNetworkEvents: (data) => void` - Receives network events for all built-in actions like dragging a card, opening the context menu, etc.
- `interactWithContextMenus: () => void` - Checks whether or not any card's context menu actions are being clicked and responds accordingly.
- `reset: () => void` - Destroys every active stack. This is not synced between clients.
- `find: (id: number) => CardStack` - Gets a stack by its ID
- `destroy: (id: number, foreign) => void` - Destroys a stack by its ID. If `foreign == false`, it will tell the other client to destroy this stack too.
- `instantiate: (cards: string[], pos: Point, faceDown: boolean, foreign)` - Creates a new stack and adds it to the game. If `foreign == false`, it will tell the other client to do the same.

### EffectArea
An effect area is a rectangular zone on the board that will interact with a stack whenever it enters or exits its bounding box. Note that a stack only has to **intersect** with the zone's bounding box to be considered "inside" the zone. If you want to make it so that a stack has to be 100% inside the zone, you can either check if this is the case manually, or you can modify the source code of `CardStack.updateEffectAreaInfluence()` (it's a really simple function).
- `constructor(label: string, x: number, y: number, width: number, height: number)` - Instantiates an `EffectArea` with the aforementioned parameters. Note that this **does not** add the effect area to the game. To do that, pass your `EffectArea` as the parameter to `EffectAreas.active.push(area: EffectArea)`.
- `id: number` - Readonly. Each effect area has a unique identifying ID.
- `label: string` - The label that's shown inside the zone.
- `colour: string` - This zone's colour. Accepts any CSS colour.
- `pos: Point` - Readonly. The effect area's position.
- `size: Size` - Readonly. The effect area's size.
- `cardsContained: CardStack[]` - Readonly. The cards that are currently intersecting with this area's bounding box.
- `onStackEnter: (stack: CardStack) => void` - A callback for when a stack enters this zone.
- `onStackExit: (stack: CardStack) => void` - A callback for when a stack exits this zone.
- `update: (dt) => void` - Updates this effect area
- `draw: (g) => void` - Draws this effect area
- `getRect: () => Rect` - Returns this effect area's bounding box.
- `setRect: (rect: Rect, foreign) => void` - Sets this effect area's position and size. If `foreign == false`, it will notify the other client to do the same.

### EffectAreas
Like `CardStacks`, `EffectAreas` is a static class that handles effect areas as a whole.
 - `updateAll: (dt) => void` - Updates all effect areas.
 - `drawAll: (g) => void` - Draws all effect areas.
 - `receiveNetworkEvents: (data) => void` - Receives network events for all built-in interactions that have to do with effect areas, like `setRect`.
 - `reset: () => void` - Destroys every effect area. 
 - `find: (id: number) => EffectArea` - Finds an effect area by ID.

### Notification
A "notification" isn't a real class defined anywhere, but instead a structure that is compatible with the following interface:
```ts
{
    text: string,
    timeLeft: number
}
```

### Notifications
The "notifications" section is on the bottom right of the screen whenever a yellow message comes up, like when the other player clicks an item in the context menu.
- `active: Notification[]` - The list of currently active notifications.
- `send: (text: string, foreign) => void` - Sends a message in the notifications sections. If `foreign == false` then this message is only sent to the local client.
- `tick: (dt, g) => void` - Draws and updates the notifications section.
- `receiveMessages: (data) => void` - Receives any notifications from the other client.

To change the default time that a given message is onscreen, set the constant `MESSAGE_DURATION`.

### GameNetwork
A thin abstraction layer over Peer.js.
- `roomName: string` - Readonly. The name of the current room.
- `isConnected: boolean` - Readonly. Whether or not the local client is connected to the room. Under normal circumstances this will always be true.
- `isOtherConnected: boolean` - Readonly. Whether or not the other client is connected to the room. Under normal circumstances this will always be true.
- `isHost: boolean` - Readonly. Whether or not the local client is the host. (The one who created the room.)
- `send: (obj: any) => void` - Mostly for internal use. Sends arbitrary JSON to the other client, does not necessarily route those messages to the game code. If you want to send game-related data to the other client, use `Game.send()`.

### Game
The game engine, essentially. Your game-specific code hooks into events generated by `Game`. In addition, it also provides some useful functions and variables.
- `canvas: HTMLCanvasElement` - The canvas, as a DOM element.
- `WIDTH: number` - The game's width in pixels.
- `HEIGHT: number` - The game's height in pixels.
- `selfMousePos: Point` - The local client's mouse position
- `otherMousePos: Point` - The other client's last known mouse position. Note that this only gets updated when the other client sends the following object using `Game.send()` or the `NetworkBuffer`:
```ts
{
    pos: Point, // The mouse's position
    immediate: boolean // If this is true, otherMousePosSmooth will also be set, instantly instead of smoothly interpolating.
}
```
- `otherMousePosSmooth: Point` - The other client's interpolated mouse position, based on his last known mouse position. 
- `canvasEvent: (eventName: string, callback: EventListener)` - Shortcut for `Game.canvas.addEventListener(eventName, callback, false);`
- `send: (data: any) => void` - Sends JSON to the other client. The other client will then receive it in his `Game.netReceive`.

### Util
Util is a mish-mash of useful functions and variables that I needed.
- `lerp: (a: number, b: number, t: number) => number` - Linearly interpolates between numbers a and b with a delta of t
- `vecLerp: (a: Vector, b: Vector, t: number) => Vector` - Linearly interpolates between vectors a and b with a delta of t
- `browserToCanvasCoords: (canvas: HTMLCanvasElement, evt: Event) => Point` - Given a canvas and the `clientX` and `clientY` from an `Event`, it returns a the proper coordinate on the canvas. This is for converting browser coordinates to canvas coordinates for events like mouse clicks or mobile taps.
- `pointInRect: (p: Point, r: Rect) => boolean` - Returns whether or not point `p` is inside rectangle `r`.
- `dist: (a: Point, b: Point) => number` - Returns the distance between points `a` and `b`.
- `shuffle: (a: T[]) => T[]` - Shuffles an array in place and returns it. Note that this mutates the array.
- `intersectsAABB: (a: Rect, b: Rect) => boolean` - Returns true if rectangle `a` intersects with rectangle `b`.
- `emptyClosure: () => void` - Does literally nothing. Use it for when things require a callback but you don't need one.

## Graphics
Pretty empty, honestly.
- `clear: (g, colour: string)` - Clears the canvas a certain colour.









