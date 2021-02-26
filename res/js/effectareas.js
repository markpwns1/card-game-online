var EffectAreas = {
    active: [ ]
};

EffectAreas.reset = () => {
    EffectAreas.active = [ ];
    effectAreaIDCounter = 0;
}

// Receives network events for all built-in interactions that have to do
// with effect areas
EffectAreas.receiveNetworkEvents = data => {
    if(data.effectAreaRectSet) {
        const found = EffectAreas.find(data.effectAreaRectSet.id);
        if(found)
            found.setRect(data.effectAreaRectSet.rect, true);
    }
};

// Updates all active effect areas
EffectAreas.updateAll = dt => {
    for (const effectArea of EffectAreas.active) {
        effectArea.update(dt);
    }
};

// Draws all active effect areas
EffectAreas.drawAll = g => {
    for (const effectArea of EffectAreas.active) {
        effectArea.draw(g);
    }
};

// Finds an effect area with a certain ID
EffectAreas.find = id => EffectAreas.active.find(x => x.id == id);

let effectAreaIDCounter = 0;
class EffectArea {
    id = -1; // READONLY. Unique ID for each instance
    label = "Effect Zone"; // The label that's shown inside the zone
    colour = "rgb(0, 100, 0)"; // The colour inside the zone (any CSS colour works)

    //  READONLY. Self explanatory.
    pos = { x: 0, y: 0 };
    size = { x: 100, y: 100 };

    cardsContained = [ ]; // READONLY. An array of all the cards inside the zone.

    // Called when a stack intersects or stops intersecting with this zone's rect
    onStackEnter = Util.emptyClosure;
    onStackExit = Util.emptyClosure;

    constructor(label, x, y, width, height) {
        this.id = ++effectAreaIDCounter;
        this.label = label;
        this.pos = { x: x, y: y };
        this.size = { x: width, y: height };
    }

    // Returns the bounding box of this zone
    getRect() {
        return { ...this.pos, width: this.size.x, height: this.size.y };
    }

    // Draws the zone
    draw(g) {
        g.fillStyle = "black";
        g.beginPath();
        g.rect(this.pos.x, this.pos.y, this.size.x, this.size.y);
        g.stroke();

        g.fillStyle = this.colour;
        g.fillRect(this.pos.x, this.pos.y, this.size.x, this.size.y);

        g.fillStyle = "black";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.font = "14px Arial";
        g.fillText(this.label, this.pos.x + this.size.x / 2, this.pos.y + this.size.y / 2);
    }

    // Sets the bounding box of the zone. This operation is synced across clients.
    setRect(rect, foreign = false) {
        this.pos = { x: rect.x, y: rect.y };
        this.size = { x: rect.width, y: rect.height };

        if(!foreign)
            NetworkBuffer.addOne("effectAreaRectSet", {
                id: this.id,
                rect: rect
            });
    }

    // Updates the zone
    update(dt) { }
}