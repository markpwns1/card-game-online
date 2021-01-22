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