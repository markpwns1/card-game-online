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
        $("#join-menu").hide();

        let name = words({
            exactly:3
        }).join("-");

        // console.log(name);
        // GameNetwork.createRoom("abc");
        GameNetwork.createRoom(name);
    });
});

$(document).on("joinsuccess", () => {
    if(GameNetwork.isHost && !GameNetwork.isOtherConnected) {
        $("#waiting-for-player").show();
        $(".room-name").text(GameNetwork.roomName);
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