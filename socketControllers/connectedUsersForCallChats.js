const connectedUsers = new Map();
let io = null;

const addNewConnectedUser = ({ socketId, userId }) => {
    connectedUsers.set(socketId, { userId });
};

// get active connections of a particular user
const getActiveConnections = (userId) => {
    // get user's socket ids(active socket connections)
    const activeConnections = [];
    connectedUsers.forEach((value, key) => {
        if (value.userId === userId) {
            activeConnections.push(key);
        }
    });
    return activeConnections;
};

const setServerSocketInstance = (ioInstance) => {
    io = ioInstance;
};

const getServerSocketInstance = () => {
    return io;
};


export{
    addNewConnectedUser,
    getActiveConnections,
    getServerSocketInstance,
    setServerSocketInstance
};
