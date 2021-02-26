var Graphics = { };

// Clears the canvas a certain colour
Graphics.clear = (g, col) => {
    g.fillStyle = col;
    g.fillRect(0, 0, Game.WIDTH, Game.HEIGHT);
};