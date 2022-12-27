import Server from "socket.io";
import {
  addNotification,
  deleteNotifOnMsgDelete,
  checkNotification,
} from "../controllers/UserController.js";
import dotenv from "dotenv";
dotenv.config();
import { callRequestHandler } from "../socketControllers/callRequestHandler.js";
import { detectVolumeHandler } from "../socketControllers/detectVolumeHandler.js";
import { callResponseHandler } from "../socketControllers/callResponseHandler.js";

import { addNewConnectedUser, setServerSocketInstance } from "../socketControllers/connectedUsersForCallChats.js";
import { notifyChatLeft } from "../socketControllers/notifyChatLeft.js";


// Message event listeners
const configureMsgEvents = (socket) => {
  // new message
  socket.on("new msg sent", async (newMsg) => {
    const { chat } = newMsg; 
    if (!chat) return;
    console.log(newMsg);
    await Promise.all(
      chat.users.map(async (userId) => {
        // Emit 'newMsg' to all other users except 'newMsg' sender
        if (userId !== newMsg.sender?._id) {
          const { notifications } = await addNotification(newMsg._id, userId);
          socket.to(userId).emit("new msg received", newMsg, notifications);
        }
      }) 
    );
  });

  // message delete
  socket.on("msg deleted", async (deletedMsgData) => {
    const { deletedMsgId, senderId, chat } = deletedMsgData;
    if (!deletedMsgId || !senderId || !chat) return;

    // Emit a socket to delete 'deletedMsg' for all chat users
    // except 'deletedMsg' sender
    await Promise.all(
      chat.users.map(async (user) => {
        if (user._id !== senderId) {
          await deleteNotifOnMsgDelete(deletedMsgId, user._id);
          socket.to(user._id).emit("remove deleted msg", deletedMsgData);
        }
      })
    );
  });

  socket.on("msg updated", (updatedMsg) => {
    const { sender, chat } = updatedMsg;
    if (!sender || !chat) return;

    chat.users.forEach((userId) => {
      if (userId !== sender._id) {
        console.log(updatedMsg)
        socket.to(userId).emit("update modified msg", updatedMsg);
      }
    });
  });
};

// Group event listeners
const configureGroupEvents = (socket) => {
  socket.on("new grp created", (newGroupData) => {
    const { admin, newGroup } = newGroupData;
    if (!admin || !newGroup) return;

    newGroup.users.forEach((user) => {
      if (user._id !== admin._id) {
        socket.to(user._id).emit("display new grp");
      }
    });
  });

  socket.on("grp updated", (updatedGroupData) => {
    // 'updater' is the one who updated the grp (admin/non-admin)
    const { updater, updatedGroup } = updatedGroupData;
    if (!updater || !updatedGroup) return;
    const { removedUser } = updatedGroup;

    updatedGroup.users.forEach((user) => {
      if (user._id !== updater._id) {
        socket.to(user._id).emit("display updated grp", updatedGroupData);
      }
    });
    if (removedUser) {
      socket.to(removedUser._id).emit("display updated grp", updatedGroupData);
    }
  });

  socket.on("grp deleted", (deletedGroupData) => {
    // 'admin' is the one who updated the grp
    const { admin, deletedGroup } = deletedGroupData;
    if (!admin || !deletedGroup) return;

    deletedGroup.users.forEach((user) => {
      if (user._id !== admin._id) {
        socket.to(user._id).emit("remove deleted grp", deletedGroup);
      }
    });
  });
};

// Typing event listeners
const configureTypingEvents = (socket) => {
  socket.on("typing", (chat, typingUser) => {
    if (!chat || !typingUser) return;
    chat.users?.forEach((user) => {
      if (user?._id !== typingUser?._id) {
        socket.to(user?._id).emit("display typing", chat, typingUser);
      }
    });
  });

  socket.on("stop typing", (chat, typingUser) => {
    if (!chat || !typingUser) return;
    chat.users?.forEach((user) => {
      if (user?._id !== typingUser?._id) {
        socket.to(user?._id).emit("hide typing", chat, typingUser);
      }
    });
  });
};

// Disconnect event listeners
const configureDisconnectEvents = (socket) => {

  // socket.off("init user", (userId) => {
  //   console.log(userId);
  //   console.log("User socket disconnected",userId);
  //   socket.leave(userId);
  // });

};
  




// config socket primary
const configureSocketEvents = (server) => {
  // Sockets setup
  const io = new Server(server, {
    pingTimeout: 120000,
    cors: { origin: process.env.FRONT_END_BASE_URL },
  });

  setServerSocketInstance(io)


  // check authentication of user
  let activeUsers = [];
  io.on("connection", (socket) => {
    // Initialize user
    socket.on("init user",async (userId) => {
      socket.join(userId);
      addNewConnectedUser({ socketId: socket.id, userId: userId});
      //  console.log("New User Connected",userId);
      const userData=await checkNotification(userId)

      socket.emit(`user connected`,userData?.notifications);

      if (!activeUsers.some((user) => user.userId === userId)) {
        activeUsers.push({ userId: userId, socketId: socket.id });
        // console.log("New User Connected",activeUsers);
      }

       // send all active users to new user
       io.emit("get-users", activeUsers);
      //  console.log("New User Connected",activeUsers);
     
   }); 

    // Initialize chat
    socket.on("join chat", (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat : ${chatId}`);
    });

    socket.on("disconnect", () => {
      activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
      io.emit("get-users", activeUsers);
      // console.log(`user disconnected`,activeUsers);

    });
  

    socket.on("call-request", (data) => {
      callRequestHandler(socket, data);
    })

    socket.on("detectVolume", (data) => {
      detectVolumeHandler(socket, data);
    })


    socket.on("call-response", (data) => {
      callResponseHandler(socket, data);
    })

    socket.on("notify-chat-left", (data) => {
      notifyChatLeft(socket, data);
    });

    configureMsgEvents(socket);
    configureGroupEvents(socket);
    configureTypingEvents(socket);
    configureDisconnectEvents(socket,activeUsers);

  });
};

export default configureSocketEvents;
