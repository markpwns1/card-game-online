// The directory to search for when looking for sprites
const IMAGE_DIR = "res/images/";

var Sprites = { 
    _sprites: [ ]
};

const loadImage = src => {
    const img = new Image();
    img.src = src;
    return img;
};

// Loads many sprites in advance, given an array of filenames
// inside res/images
Sprites.load = list => {
    for (const name of list) {
        Sprites._sprites[name] = loadImage(IMAGE_DIR + name);
    }
};

// Loads one sprite in advance
Sprites.loadOne = name => {
    Sprites.load([ name ]);
}

// Gets a sprite by its filename (of type Image)
Sprites.get = name => {
    let sprite = Sprites._sprites[name];
    if(!sprite) {
        Sprites.loadOne(name);
        sprite = Sprites._sprites[name];
    }
    return sprite;
};

// Returns whether or not a sprite is loaded already
Sprites.isLoaded = name => Sprites._sprites[name];