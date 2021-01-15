let peer;
let connection;

const gameBeginEvent = new CustomEvent("gamebegin");
const otherDisconnectedEvent = new CustomEvent("otherdisconnected");
const roomCreatedEvent = new CustomEvent("roomcreated");
const joinSuccessEvent = new CustomEvent("joinsuccess");

var GameNetwork;

let onOtherDisconnected = () => {
    peer.disconnect();

    GameNetwork.isConnected = false;
    GameNetwork.roomName = null;
    GameNetwork.isHost = false;

    document.dispatchEvent(otherDisconnectedEvent);
};

let onDataReceived = () => {

};

let onRoomCreated = () => {
    GameNetwork.isHost = true;

    document.dispatchEvent(roomCreatedEvent);
}

let onJoinSuccess = name => {
    GameNetwork.isConnected = true;
    GameNetwork.roomName = name;

    document.dispatchEvent(joinSuccessEvent);
};

let onOtherConnected = () => {
    GameNetwork.isOtherConnected = true;
}

let onGameBegin = () => {
    document.dispatchEvent(gameBeginEvent);
};

let onJoinFailed = data => {
    connection.close();
    peer.disconnect();

    // console.log(data);

    let joinFailedEvent = new CustomEvent("joinfailed");
    joinFailedEvent.reason = data.reason;

    document.dispatchEvent(joinFailedEvent);
};

GameNetwork = {

    EVENT_JOIN_ATTEMPT: 0,
    EVENT_JOIN_SUCCESS: 1,
    EVENT_JOIN_FAIL: 2,
    EVENT_DISCONNECT: 3,

    roomName: null,
    isConnected: false,
    isOtherConnected: false,
    isHost: false,

    createRoom: function(name) {
        peer = new Peer(name);

        onRoomCreated();
        onJoinSuccess(name);

        peer.on("connection", c => {
            c.on("open", () => {
                c.on("data", content => {
                    let data = JSON.parse(content);
                    if(data.type == this.EVENT_JOIN_ATTEMPT) {
                        if(this.isOtherConnected) {
                            console.log("Someone tried to join a full room");
                            c.send(JSON.stringify({
                                type: this.EVENT_JOIN_FAIL,
                                reason: "Room full"
                            }));
                        }
                        else {
                            connection = c;
                            this.send({
                                type: this.EVENT_JOIN_SUCCESS
                            });
                            connection.on("close", onOtherDisconnected);
                            onOtherConnected();
                            onGameBegin();
                        }
                    }
                    else {
                        onDataReceived(data);
                    }
                });
            });
        });
    },

    send: function(obj) {
        let content = JSON.stringify(obj);
        connection.send(content);
    },

    joinRoom: function(name) {
        peer = new Peer();

        peer.on("error", e => {
            let reasons = {
                "peer-unavailable": "Room does not exist"
            };
            onJoinFailed({
                reason: reasons[e.type] || e.type
            });
        });

        peer.on("open", () => {
            connection = peer.connect(name);
            connection.on("open", () => {
                connection.on("data", content => {
                    let data = JSON.parse(content);
                    if(data.type == this.EVENT_JOIN_SUCCESS) {
                        onJoinSuccess(name);
                        onGameBegin();
                    }
                    else if(data.type == this.EVENT_JOIN_FAIL) {
                        onJoinFailed(data);                        
                    }
                    else {
                        onReceiveEvent(data);
                    }
                });

                connection.on("close", onOtherDisconnected);

                this.send({ 
                    type: this.EVENT_JOIN_ATTEMPT
                });
            });
        });
    }
};