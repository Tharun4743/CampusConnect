import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axiosInstance from "../lib/axiosInstance";

export interface UserContextType {
  id: string;
  name: string;
  email: string;
  role: "student" | "tpo" | "hr" | "admin";
  status: "pending" | "active" | "rejected";
  college_name?: string | null;
}

interface AuthContextType {
  user: UserContextType | null;
  loading: boolean;
  login: (userData: UserContextType) => void;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserContextType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refetchUser = async () => {
    try {
      const response = await axiosInstance.get("/api/auth/me");
      if (response.data?.success && response.data?.data?.user) {
        setUser(response.data.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();
  }, []);

  const login = (userData: UserContextType) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      setLoading(true);
      await axiosInstance.post("/api/auth/logout");
      setUser(null);
    } catch (error) {
      console.error("Logout request error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
