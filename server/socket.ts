import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "./config/security";

let io: Server | null = null;

const connectedUsers = new Map<string, Set<string>>();

function extractToken(socket: Socket): string | null {
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }
  const cookies = socket.handshake.headers.cookie;
  if (cookies) {
    const match = cookies.split(";").find((c: string) => c.trim().startsWith("token="));
    if (match) {
      return match.split("=")[1].trim();
    }
  }
  return null;
}

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowed = (process.env.APP_URL || origin).replace(/\/+$/, "");
        if (origin === allowed) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = extractToken(socket);
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(token, getJwtSecret()) as {
        userId: string;
        role: string;
      };
      (socket as any).userId = decoded.userId;
      (socket as any).role = decoded.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket as any).userId;
    socket.join(userId);

    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(socket.id);

    socket.on("disconnect", () => {
      const sockets = connectedUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
    });
  });

  console.log("Socket.IO initialized");
  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(userId).emit(event, data);
  }
}

export function emitToUsers(userIds: string[], event: string, data: any) {
  if (io) {
    userIds.forEach((uid) => io!.to(uid).emit(event, data));
  }
}
