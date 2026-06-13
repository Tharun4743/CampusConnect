import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  unreadCount: number;
  notifications: any[];
  addNotification: (n: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const s = io({
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      console.log("Socket connected");
    });

    s.on("notification", (data: any) => {
      setNotifications((prev) => [data, ...prev]);
      if (!data.read) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    s.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });

    s.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user?.id]);

  const addNotification = useCallback((n: any) => {
    setNotifications((prev) => [n, ...prev]);
    if (!n.read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  return (
    <SocketContext.Provider value={{ unreadCount, notifications, addNotification }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
