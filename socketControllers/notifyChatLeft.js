import { getActiveConnections, getServerSocketInstance } from "./connectedUsersForCallChats.js"

const notifyChatLeft = (socket, data) => {
    const { otherUserId } = data;
    // const { userId } = socket.user;

    // active connections of the receiver user
    const activeConnections = getActiveConnections(otherUserId);

    // send call response(accepted or rejected) to all the active connections of the receiver user
    const io = getServerSocketInstance();

    activeConnections.forEach((socketId) => {
        io.to(socketId).emit("notify-chat-left");
    });
};

export {
    notifyChatLeft
}
