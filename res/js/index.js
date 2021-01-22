let roomNameTextbox;
let roomJoinBtn;
let roomCreateBtn;

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
        // GameNetwork.joinRoom("abc");
        GameNetwork.joinRoom(name);
    });

    roomCreateBtn.click(() => {
        $("#waiting-for-player").show();
        $("#join-menu").hide();

        let name = words({
            exactly:3
        }).join("-");

        // console.log(name);
        // GameNetwork.createRoom("abc");
        GameNetwork.createRoom(name);
    });

    const urlParams = new URLSearchParams(window.location.search);
    const toJoin = urlParams.get('join');

    if(toJoin) {
        $("#join-menu").hide();
        $("#joining-room").show();

        GameNetwork.joinRoom(toJoin);
    }
});

$(document).on("joinsuccess", () => {
    if(GameNetwork.isHost && !GameNetwork.isOtherConnected) {
        $("#waiting-for-player").show();
        $(".room-name").text(GameNetwork.roomName);
        $(".room-link").text(window.location.protocol + '//' + window.location.host + window.location.pathname + 
            "?join=" + GameNetwork.roomName);
    }
});

$(document).on("joinfailed", e => {
    $("#join-failed-reason").text(e.originalEvent.reason);

    $("#joining-room").hide();
    $("#waiting-for-player").hide();
    $("#game").hide();

    $("#join-menu").show();
    $("#join-failed-alert").show();
});

$(document).on("gamebegin", () => {
    $(".join-menu-container").hide();
    $("#join-menu").hide();
    $("#joining-room").hide();
    $("#waiting-for-player").hide();
    $("#game").show();

    Game.init();
});

$(document).on("otherdisconnected", () => {
    $("#join-failed-reason").text("The other player disconnected");

    $("#joining-room").hide();
    $("#waiting-for-player").hide();
    $("#game").hide();

    $(".join-menu-container").show();
    $("#join-menu").show();
    $("#join-failed-alert").show();
});