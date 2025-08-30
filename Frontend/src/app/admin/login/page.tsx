"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/api";

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.login(
        credentials.username,
        credentials.password
      );

      // Check if user is admin
      const isAdmin =
        credentials.username === "admin" ||
        credentials.username.includes("admin") ||
        response.user.email.includes("admin");

      if (isAdmin) {
        // Redirect to admin panel
        window.location.href = "/admin";
      } else {
        setError("Access denied. Administrator privileges required.");
      }
    } catch (error: any) {
      console.error("Admin login failed:", error);
      setError(
        error.response?.data?.detail ||
          error.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>
              Access the SocialConnect Admin Panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium mb-1"
                >
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter admin username"
                  value={credentials.username}
                  onChange={(e) =>
                    setCredentials({ ...credentials, username: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-1"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading || !credentials.username || !credentials.password
                }
              >
                {isLoading ? "Signing In..." : "Sign In to Admin Panel"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="text-sm"
              >
                ← Back to Main App
              </Button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-800">
                <strong>Demo Admin Credentials:</strong>
                <br />
                Username: admin
                <br />
                Password: admin123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
