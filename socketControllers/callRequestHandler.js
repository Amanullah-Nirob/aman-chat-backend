import { getActiveConnections, getServerSocketInstance } from "./connectedUsersForCallChats.js";


const callRequestHandler = (socket, data) => {
    const { receiverUserId, callerName,callerPhoto,audioOnly, signal,senderId } = data;
    const callerUserId = senderId;

    // active connections of the receiver user
    const activeConnections = getActiveConnections(receiverUserId);
    console.log(activeConnections);
    // send call request to all the active connections of the receiver user
    const io = getServerSocketInstance();

    activeConnections.forEach((socketId) => {
        io.to(socketId).emit("call-request", { callerName,callerPhoto,callerUserId, audioOnly, signal });
    }
    );
 


}


export {
    callRequestHandler
} 