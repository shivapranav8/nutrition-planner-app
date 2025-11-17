import { useState, useEffect } from "react";
import { Apple, Mail } from "lucide-react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface AuthScreenProps {
  onAuthSuccess: (user: { id: string; email: string; name: string; picture?: string }) => void;
}

function AuthScreenContent({ onAuthSuccess }: AuthScreenProps) {
  // Get redirect URI without any whitespace
  const redirectUri = window.location.origin.trim();
  const [isSignIn, setIsSignIn] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError("");
        
        // Get user info from Google
        const userInfoResponse = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        const userData = {
          id: userInfoResponse.data.sub,
          email: userInfoResponse.data.email,
          name: userInfoResponse.data.name,
          picture: userInfoResponse.data.picture,
        };

        // Send to backend to create/update user
        const backendResponse = await axios.post(
          "http://localhost:3001/api/auth/google",
          {
            googleId: userData.id,
            email: userData.email,
            name: userData.name,
            picture: userData.picture,
            accessToken: tokenResponse.access_token,
          }
        );

        onAuthSuccess({
          id: backendResponse.data.userId || userData.id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          token: backendResponse.data.token,
        });
      } catch (error: any) {
        console.error("Google login error:", error);
        setError(error.response?.data?.error || "Failed to sign in with Google");
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google OAuth error:", error);
      const cleanRedirectUri = redirectUri.trim();
      if (error.error === "redirect_uri_mismatch" || error.error_description?.includes("redirect_uri_mismatch")) {
        setError(
          `Redirect URI mismatch!\n\n` +
          `Add these EXACT URIs (NO SPACES, NO QUOTES):\n` +
          `${cleanRedirectUri}\n` +
          `${cleanRedirectUri}/\n\n` +
          `Steps:\n` +
          `1. Go to: https://console.cloud.google.com/apis/credentials\n` +
          `2. Edit your OAuth 2.0 Client ID\n` +
          `3. Click "+ ADD URI"\n` +
          `4. Type: ${cleanRedirectUri} (NO SPACES)\n` +
          `5. Click "+ ADD URI" again, type: ${cleanRedirectUri}/ (NO SPACES)\n` +
          `6. Save and wait 2-3 minutes\n` +
          `7. Try again`
        );
      } else if (error.error_description?.includes("whitespace") || error.error?.includes("whitespace")) {
        setError(
          `Invalid Redirect URI: Contains whitespace!\n\n` +
          `The redirect URI must have NO SPACES.\n` +
          `Make sure when you paste in Google Cloud Console:\n` +
          `- No leading spaces\n` +
          `- No trailing spaces\n` +
          `- No spaces anywhere\n\n` +
          `Correct format: ${cleanRedirectUri}\n` +
          `Wrong format: " ${cleanRedirectUri} " (has spaces)`
        );
      } else {
        setError(`Failed to sign in with Google: ${error.error || error.error_description || "Unknown error"}`);
      }
      setIsLoading(false);
    },
  });

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const endpoint = isSignIn ? "/api/auth/signin" : "/api/auth/signup";
      const response = await axios.post(`http://localhost:3001${endpoint}`, {
        email: formData.email,
        password: formData.password,
        ...(isSignIn ? {} : { fullName: formData.fullName }),
      });

      onAuthSuccess({
        id: response.data.userId,
        email: response.data.email,
        name: response.data.name || formData.fullName,
        token: response.data.token,
      });
    } catch (error: any) {
      console.error("Email auth error:", error);
      setError(error.response?.data?.error || `Failed to ${isSignIn ? "sign in" : "sign up"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00D9FF] rounded-lg flex items-center justify-center">
            <Apple className="w-5 h-5 text-[#0B1120]" fill="currentColor" />
          </div>
          <span className="text-white">NutriPlan</span>
        </div>
        <div className="text-gray-400 text-sm">
          For Students & IT Professionals
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo and Welcome */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#00D9FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Apple className="w-8 h-8 text-[#0B1120]" fill="currentColor" />
            </div>
            <h1 className="text-white mb-2">Welcome to NutriPlan</h1>
            <p className="text-gray-400">Your personalized nutrition companion</p>
          </div>

          {/* Sign Up Form */}
          <div className="bg-[#162136] rounded-2xl p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400 whitespace-pre-line">
                {error}
              </div>
            )}

            {/* Google Sign In */}
            <Button
              onClick={() => handleGoogleLogin()}
              disabled={isLoading}
              variant="outline"
              className="w-full bg-white text-black hover:bg-gray-100 border-0 h-12"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 border-t border-gray-700"></div>
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 border-t border-gray-700"></div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {!isSignIn && (
                <div>
                  <label className="block text-white text-sm mb-2">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="w-full bg-[#0B1120] border-gray-700 text-white placeholder:text-gray-500 h-12"
                    required={!isSignIn}
                  />
                </div>
              )}

              <div>
                <label className="block text-white text-sm mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your.email@example.com"
                  className="w-full bg-[#0B1120] border-gray-700 text-white placeholder:text-gray-500 h-12"
                  required
                />
              </div>

              <div>
                <label className="block text-white text-sm mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Create a secure password"
                  className="w-full bg-[#0B1120] border-gray-700 text-white placeholder:text-gray-500 h-12"
                  required
                  minLength={6}
                />
              </div>

              {/* Sign Up Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#00D9FF] hover:bg-[#00C4EA] text-[#0B1120] h-12"
              >
                <Mail className="w-5 h-5 mr-2" />
                {isSignIn ? "Sign In" : "Sign Up"} with Email
              </Button>
            </form>

            {/* Terms */}
            {!isSignIn && (
              <p className="text-center text-sm text-gray-400">
                By continuing, you agree to our{" "}
                <a href="#" className="text-[#00D9FF] hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#00D9FF] hover:underline">
                  Privacy Policy
                </a>
              </p>
            )}
          </div>

          {/* Sign In Link */}
          <p className="text-center mt-6 text-gray-400">
            {isSignIn ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsSignIn(!isSignIn);
                setError("");
                setFormData({ fullName: "", email: "", password: "" });
              }}
              className="text-[#00D9FF] hover:underline"
            >
              {isSignIn ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  if (!googleClientId) {
    console.warn("Google Client ID not found. Please add VITE_GOOGLE_CLIENT_ID to your .env file");
  }

  // Log the redirect URI that will be used
  useEffect(() => {
    const redirectUri = window.location.origin.trim();
    console.log("🔍 Google OAuth Configuration:");
    console.log("  Client ID:", googleClientId ? `${googleClientId.substring(0, 20)}...` : "NOT SET");
    console.log("  Redirect URI (no whitespace):", JSON.stringify(redirectUri));
    console.log("  Full URL:", window.location.href);
    console.log("\n📋 Copy these EXACT redirect URIs (no spaces, no quotes):");
    console.log(redirectUri);
    console.log(redirectUri + "/");
  }, [googleClientId]);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthScreenContent onAuthSuccess={onAuthSuccess} />
    </GoogleOAuthProvider>
  );
}
