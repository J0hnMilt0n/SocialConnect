"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/lib/api";

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const info: any = {
      hasValidTokens: false,
      accessToken: null,
      refreshToken: null,
      currentUser: null,
      error: null,
    };

    try {
      // Check if tokens exist
      info.hasValidTokens = authService.hasValidTokens();
      info.accessToken = localStorage.getItem("access_token");
      info.refreshToken = localStorage.getItem("refresh_token");

      console.log("🔍 Debug - Has valid tokens:", info.hasValidTokens);
      console.log("🔍 Debug - Access token exists:", !!info.accessToken);
      console.log("🔍 Debug - Refresh token exists:", !!info.refreshToken);

      if (info.hasValidTokens) {
        try {
          const user = await authService.getCurrentUser();
          info.currentUser = user;
          console.log("🔍 Debug - Current user:", user);
        } catch (userError) {
          info.error = `Failed to get current user: ${userError}`;
          console.error("🔍 Debug - User fetch error:", userError);
        }
      }
    } catch (error) {
      info.error = `General error: ${error}`;
      console.error("🔍 Debug - General error:", error);
    }

    setDebugInfo(info);
    setIsLoading(false);
  };

  const clearTokens = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    authService.clearAuth();
    checkAuthStatus();
  };

  const testAdminCheck = () => {
    if (debugInfo.currentUser) {
      const user = debugInfo.currentUser;
      const isAdmin =
        user.username === "admin" ||
        user.username.includes("admin") ||
        user.email.includes("admin");

      alert(
        `Admin check result: ${isAdmin}\nUsername: ${user.username}\nEmail: ${user.email}`
      );
    } else {
      alert("No current user found");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading debug info...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Token Status</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    Has Valid Tokens:{" "}
                    <span
                      className={
                        debugInfo.hasValidTokens
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {debugInfo.hasValidTokens ? "✅ Yes" : "❌ No"}
                    </span>
                  </div>
                  <div>
                    Access Token:{" "}
                    <span
                      className={
                        debugInfo.accessToken
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {debugInfo.accessToken ? "✅ Present" : "❌ Missing"}
                    </span>
                  </div>
                  <div>
                    Refresh Token:{" "}
                    <span
                      className={
                        debugInfo.refreshToken
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {debugInfo.refreshToken ? "✅ Present" : "❌ Missing"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">User Status</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    Current User:{" "}
                    <span
                      className={
                        debugInfo.currentUser
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {debugInfo.currentUser ? "✅ Loaded" : "❌ Not loaded"}
                    </span>
                  </div>
                  {debugInfo.currentUser && (
                    <>
                      <div>
                        Username:{" "}
                        <strong>{debugInfo.currentUser.username}</strong>
                      </div>
                      <div>
                        Email: <strong>{debugInfo.currentUser.email}</strong>
                      </div>
                      <div>
                        Admin Check:{" "}
                        <span
                          className={
                            debugInfo.currentUser.username === "admin" ||
                            debugInfo.currentUser.username.includes("admin") ||
                            debugInfo.currentUser.email.includes("admin")
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {debugInfo.currentUser.username === "admin" ||
                          debugInfo.currentUser.username.includes("admin") ||
                          debugInfo.currentUser.email.includes("admin")
                            ? "✅ Is Admin"
                            : "❌ Not Admin"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {debugInfo.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="font-semibold text-red-800">Error:</h4>
                <p className="text-red-700 text-sm">{debugInfo.error}</p>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Raw Token Data</h3>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium">Access Token:</label>
                  <div className="text-xs bg-gray-100 p-2 rounded break-all">
                    {debugInfo.accessToken || "None"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Refresh Token:</label>
                  <div className="text-xs bg-gray-100 p-2 rounded break-all">
                    {debugInfo.refreshToken || "None"}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">User Object</h3>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                {JSON.stringify(debugInfo.currentUser, null, 2)}
              </pre>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={checkAuthStatus}>Refresh Debug Info</Button>
              <Button variant="outline" onClick={clearTokens}>
                Clear Tokens
              </Button>
              <Button variant="outline" onClick={testAdminCheck}>
                Test Admin Check
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
              >
                Go to Main App
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/admin")}
              >
                Go to Admin Panel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
