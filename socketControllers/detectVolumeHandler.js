import { getActiveConnections, getServerSocketInstance } from "./connectedUsersForCallChats.js";


const detectVolumeHandler = (socket, data) => {
    const { type, volume,senderId,receiverUserId,callerName } = data;
    const callerUserId = senderId;

    // active connections of the receiver user
    const activeConnections = getActiveConnections(receiverUserId);
    console.log(activeConnections);
    // send call request to all the active connections of the receiver user
    const io = getServerSocketInstance();

    activeConnections.forEach((socketId) => {
        io.to(socketId).emit("detectVolume", {type, volume,senderId,receiverUserId,name:callerName});
    }
    );
}

export {
    detectVolumeHandler
} 