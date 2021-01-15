let peer;
let connection;

let roomNameTextbox;
let roomJoinBtn;
let roomCreateBtn;

let thisPlayer;
let otherPlayer;

let isConnected = false;
let isHost = false;

const EVENT_JOIN_ATTEMPT = "EVENT_JOIN_ATTEMPT";
const EVENT_JOIN_SUCCESS = "EVENT_JOIN_SUCCESS";
const EVENT_JOIN_FAIL = "EVENT_JOIN_FAIL";
const EVENT_DISCONNECT = "EVENT_DISCONNECT";

let emptyEvent = eventType => ({
    type: eventType
});

let send = (connection, data) => {
    connection.send(JSON.stringify(data));
};

let receive = JSON.parse;

let enterRoom = () => {
    $("#join-menu").hide();
    $("#joining-room").hide();
    $("#waiting-for-player").hide();
    $("#game").show();
    isConnected = true;
    thisPlayer = new Player();
    otherPlayer = new Player();
};

let exitRoom = () => {
    $("#joining-room").hide();
    $("#waiting-for-player").hide();
    $("#game").hide();
    $("#join-menu").show();
    isConnected = false;
    thisPlayer = null;
    otherPlayer = null;
    isHost = false;
};

let onReceiveEvent = ev => {

}

$(document).ready(() => {
    roomNameTextbox = $("#room-name-textbox");
    roomJoinBtn = $("#room-join-btn");
    roomCreateBtn = $("#room-create-btn");

    $("#join-menu-title").text(GAME_INFO.name);
    document.title = GAME_INFO.name;

    roomJoinBtn.click(() => {
        $("#join-menu").hide();
        $("#joining-room").show();

        let name = roomNameTextbox.val();
        peer = new Peer();

        peer.on("open", () => {
            connection = peer.connect(name);
            connection.on("open", () => {

                connection.on("data", d => {
                    let data = receive(d);
                    if(data.type == EVENT_JOIN_SUCCESS) {
                        enterRoom();
                        alert("Connected to " + name);
                    }
                    else if(data.type == EVENT_JOIN_FAIL) {
                        connection.close();
                        peer.disconnect();

                        $("#joining-room").hide();
                        $("#join-menu").show();

                        alert("Failed to connect to room " + name + ".\nReason: " + data.reason);
                    }
                    else {
                        onReceiveEvent(data);
                    }
                });

                connection.on("close", () => {
                    if(isConnected) {
                        peer.disconnect();

                        exitRoom();

                        alert("The other player has disconnected!");
                    }
                });

                send(connection, emptyEvent(EVENT_JOIN_ATTEMPT));
            });
        });
    });

    roomCreateBtn.click(() => {
        $("#join-menu").hide();

        let name = roomNameTextbox.val();
        peer = new Peer(name);

        alert("Room supposedly created! With ID " + name);
        $("#waiting-for-player").show();

        peer.on("connection", connection => {
            connection.on("open", () => {
                connection.on("data", d => {
                    let data = receive(d);

                    if(data.type == EVENT_JOIN_ATTEMPT) {
                        if(isConnected) {
                            send(connection, {
                                type: EVENT_JOIN_FAIL,
                                reason: "Room full"
                            });
                        }
                        else {
                            send(connection, emptyEvent(EVENT_JOIN_SUCCESS));
                            enterRoom();
                            alert("The other player has connected!");
                        }
                    }
                    else {
                        onReceiveEvent(data);
                    }
                });

                connection.on("close", () => {
                    peer.disconnect();

                    exitRoom();

                    alert("The other player has disconnected!");
                });
            });
        });
    });
});