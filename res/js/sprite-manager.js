const IMAGE_DIR = "res/images/";

var Sprites = { 
    _sprites: [ ]
};

const loadImage = src => {
    const img = new Image();
    img.src = src;
    return img;
};

Sprites.load = (list) => {
    for (const name of list) {
        Sprites._sprites[name] = loadImage(IMAGE_DIR + name);
    }
};

Sprites.loadOne = (name) => {
    Sprites.load([ name ]);
}

Sprites.get = (name) => {
    let sprite = Sprites._sprites[name];
    if(!sprite) {
        Sprites.loadOne(name);
        sprite = Sprites._sprites[name];
    }
    return sprite;
};

Sprites.isLoaded = (name) => Sprites._sprites[name];