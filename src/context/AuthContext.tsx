"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, UserSession } from "@/types/lms";
import { requestGas } from "@/utils/apiClient";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load session from localStorage on mount
    const savedToken = localStorage.getItem("upgrid_token");
    const savedUser = localStorage.getItem("upgrid_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user credentials", e);
        localStorage.removeItem("upgrid_token");
        localStorage.removeItem("upgrid_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await requestGas<UserSession>("login", {
        method: "POST",
        body: { email, password },
        retries: 1, // Minimize login retries
      });

      if (response && response.token && response.user) {
        localStorage.setItem("upgrid_token", response.token);
        localStorage.setItem("upgrid_user", JSON.stringify(response.user));
        
        setToken(response.token);
        setUser(response.user);

        // Redirect based on role
        if (response.user.role === "ADMIN") {
          router.push("/admin");
        } else if (response.user.role === "GIAO_VIEN") {
          router.push("/teacher");
        } else {
          router.push("/student");
        }
        
        setIsLoading(false);
        return { success: true };
      }
      
      setIsLoading(false);
      return { success: false, error: "Dữ liệu trả về từ server không hợp lệ." };
    } catch (error: any) {
      setIsLoading(false);
      return { success: false, error: error.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại kết nối!" };
    }
  };

  const logout = () => {
    localStorage.removeItem("upgrid_token");
    localStorage.removeItem("upgrid_user");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
