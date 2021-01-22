var Graphics = { };

Graphics.loadImage = src => {
    const img = new Image();
    img.src = src;
    return img;
};

Graphics.clear = (g, col) => {
    g.fillStyle = col;
    g.fillRect(0, 0, Game.WIDTH, Game.HEIGHT);
};