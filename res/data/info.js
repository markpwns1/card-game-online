const GAME_INFO = {
    name: "Card Game Template", // Game title, used in various places

    // Game canvas dimentions
    gameWidth: 1024,
    gameHeight: 576,

    targetFramerate: 60, // Game render and update framerate per second
    networkTickrate: 10, // Network tickrate per second

    cardBackSprite: "cardBack_red4.png", // Filename for the back-of-a-card sprite 
    cardShadowSprite: "shadow.png", // Filename for the card shadow sprite, for dragging

    // Default card dimensions (these can be overriden per-instance)
    defaultCardWidth: 88,
    defaultCardHeight: 120,

    contextMenuWidth: 150, // Context menu total width
    contextMenuItemHeight: 25, // The height of each context menu item

    // Interval in milliseconds in which 2 successive clicks will be counted 
    // as a double-click
    doubleClickInterval: 500,
    
    // Same as doubleClickInterval but for mobile taps
    doubleTapInterval: 1000
};