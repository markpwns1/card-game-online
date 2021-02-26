let buffer = { };

var NetworkBuffer = { };

// Asserts that the buffer is empty.
NetworkBuffer.assertEmpty = () => {
    if(buffer.length > 0)
        console.error("Network buffer was not empty. Contents: " + JSON.stringify(buffer, null, 2));
};

// Adds one or more structures to the network buffer. An example of an 
// argument to pass is something like this:
/*

NetworkBuffer.add({
    eventA: {
        id: "whatever",
        pos: "whatever"
    },
    eventB: {
        id: "whatever",
        size: "whatever"
    }
});

*/
NetworkBuffer.add = obj => {
    buffer = { 
        ...buffer, 
        obj
    };
};

// Adds only one event to the network buffer
NetworkBuffer.addOne = (name, data) => {
    buffer[name] = data;
};

// Sends everything inside the network buffer to the other player
NetworkBuffer.send = () => {
    Game.send(buffer);
    buffer = { };
};