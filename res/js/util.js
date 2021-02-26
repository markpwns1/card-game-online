var Util = { };

// Linearly interpolates between numbers a and b with a delta of t
Util.lerp = (a, b, t) => a + (b - a) * t;

// Linearly interpolates between vectors a and b with a delta of t
Util.vecLerp = (a, b, t) => ({ 
    x: Util.lerp(a.x, b.x, t), 
    y: Util.lerp(a.y, b.y, t)
});

// Converts browser coordinates to canvas coordinates
// https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
Util.browserToCanvasCoords = (canvas, evt) => {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
        scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for X
        scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

    return {
        x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
        y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
    }
};

// Returns true when the point p is in the rect r
Util.pointInRect = (p, r) => 
    p.x > r.x 
    && p.x < r.x + r.width 
    && p.y > r.y 
    && p.y < r.y + r.height;

// Returns the distance between vectors a and b
Util.dist = (a, b) => 
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

// (for internal use only)
const _CARD_UNITS = [ "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A" ];
Util._getStackNames = (type) => _CARD_UNITS.map(x => "card" + type + x);

// Arrays of the sprite names for various types of cards
Util.CARDS_CLUBS = Util._getStackNames("Clubs");
Util.CARDS_DIAMONDS = Util._getStackNames("Diamonds");
Util.CARDS_HEARTS = Util._getStackNames("Hearts");
Util.CARDS_SPADES = Util._getStackNames("Spades");

Util.CARD_JOKER = "cardJoker"; // The sprite name of the joker card

// Shuffles an array
// https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
Util.shuffle = (a) => {
   var j, x, i;
   for (i = a.length - 1; i > 0; i--) {
       j = Math.floor(Math.random() * (i + 1));
       x = a[i];
       a[i] = a[j];
       a[j] = x;
   }
   return a;
}

// AABB bounding box intersection between rects a and b
Util.intersectsAABB = (a, b) => 
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y

// A function that does nothing
Util.emptyClosure = () => { };