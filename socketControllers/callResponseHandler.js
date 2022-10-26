import { getActiveConnections, getServerSocketInstance } from "./connectedUsersForCallChats.js"


const callResponseHandler = (socket, data) => {
    const { receiverUserId, accepted, signal,receiveSenderId } = data;

    // const userId = socket.user.userId; // user id who accepted/rejected the call

    // active connections of the receiver user
    const activeConnections = getActiveConnections(receiverUserId);

    // send call response(accepted or rejected) to all the active connections of the receiver user
    const io = getServerSocketInstance();

    activeConnections.forEach((socketId) => {
        io.to(socketId).emit("call-response", {
            otherUserId: receiveSenderId, // user id who accepted/rejected the call
            accepted,
            signal
        });
    });
};

export {
    callResponseHandler
}