
const MESSAGE_DURATION = 3.0;

var Notifications = {
    active: [ ]
}

Notifications.send = (text, foreign = false) => {
    Notifications.active.unshift({ text: text, timeLeft: MESSAGE_DURATION });
    if(!foreign)
        NetworkBuffer.addOne("eventMessage", text);
};

Notifications.tick = (dt, g) => {
    for (let i = 0; i < Notifications.active.length; i++) {
        const msg = Notifications.active[i];
        g.fillStyle = "rgba(255, 255, 0, " + (msg.timeLeft / MESSAGE_DURATION) + ")";
        g.font = "14px Arial";
        g.textAlign = "right";
        g.textBaseline = "bottom";
        g.fillText(msg.text, Game.WIDTH - 10, Game.HEIGHT - i * 20 - 10);
        msg.timeLeft -= dt;
        if(msg.timeLeft <= 0) {
            Notifications.active = Notifications.active.filter(x => x.timeLeft > 0);
        }
    }
}

Notifications.receiveMessages = data => {
    if(data.eventMessage)
        Notifications.send(data.eventMessage, true);
};
