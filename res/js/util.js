var Util = { };

Util.lerp = (a, b, t) => a + (b - a) * t;

Util.vecLerp = (a, b, t) => ({ 
    x: Util.lerp(a.x, b.x, t), 
    y: Util.lerp(a.y, b.y, t)
});

// https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
Util.getMousePos = (canvas, e) => {
    var rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
};

Util.pointInRect = (p, r) => 
    p.x > r.x 
    && p.x < r.x + r.width 
    && p.y > r.y 
    && p.y < r.y + r.height;

Util.dist = (a, b) => 
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const CARD_UNITS = [ "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2", "A" ];
Util.getStackNames = (type) => CARD_UNITS.map(x => "card" + type + x);

Util.CARDS_CLUBS = Util.getStackNames("Clubs");
Util.CARDS_DIAMONDS = Util.getStackNames("Diamonds");
Util.CARDS_HEARTS = Util.getStackNames("Hearts");
Util.CARDS_SPADES = Util.getStackNames("Spades");
Util.CARD_JOKER = "cardJoker";

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

Util.intersectsAABB = (a, b) => 
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y