import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Key, Eye, EyeOff, CheckCircle2, AlertCircle, Save, Lock, ExternalLink, Info, ArrowLeft, Trash2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useUser } from "../contexts/UserContext";

interface ApiKeysScreenProps {
  onBack?: () => void;
}

export function ApiKeysScreen({ onBack }: ApiKeysScreenProps) {
  const { apiKeys, setApiKeys, saveApiKeys } = useUser();
  const [openaiKey, setOpenaiKey] = useState(apiKeys?.openai || "");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (apiKeys) {
      setOpenaiKey(apiKeys.openai || "");
    }
  }, [apiKeys]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    setMessage("");

    try {
      const newApiKeys = {
        openai: openaiKey.trim(),
      };

      setApiKeys(newApiKeys);
      await saveApiKeys(newApiKeys);
      
      setSaveStatus("success");
      setMessage("API key saved successfully! It is stored locally in your browser.");
    } catch (error) {
      console.error("Error saving API key:", error);
      setSaveStatus("error");
      setMessage("Failed to save API key. Please try again.");
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSaveStatus(null);
        setMessage("");
      }, 3000);
    }
  };

  const hasChanges = 
    openaiKey.trim() !== (apiKeys?.openai || "");

  const hasApiKey = (apiKeys?.openai || "").trim() !== "";

  const handleRemove = () => {
    setOpenaiKey("");
    setSaveStatus(null);
    setMessage("");
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete your API key? This will disable AI features until you add a new key.")) {
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    setMessage("");

    try {
      const newApiKeys = {
        openai: "",
      };

      setApiKeys(newApiKeys);
      await saveApiKeys(newApiKeys);
      setOpenaiKey("");
      
      setSaveStatus("success");
      setMessage("API key deleted successfully.");
    } catch (error) {
      console.error("Error deleting API key:", error);
      setSaveStatus("error");
      setMessage("Failed to delete API key. Please try again.");
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSaveStatus(null);
        setMessage("");
      }, 3000);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header Section */}
        <div className="space-y-2 pb-2">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-[#2A3242]/50 text-[#9AA3B2] hover:text-[#E6E9EF] transition-colors flex-shrink-0"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-bold text-[#E6E9EF] tracking-tight">API Key Settings</h2>
              <p className="text-[#9AA3B2] text-sm leading-relaxed mt-2">
                Enter your OpenAI API key to enable AI-powered meal suggestions, analysis, and menu parsing. 
                Your key is stored locally in your browser and never sent to our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Unified Settings Card */}
        <div className="bg-[#121722]/60 backdrop-blur-sm border border-[#2A3242]/50 rounded-xl p-6 space-y-6">
          {/* BYOK Info Section */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#22D3EE] flex-shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#E6E9EF]">
                  Bring Your Own Key (BYOK)
                </p>
                <p className="text-xs text-[#9AA3B2] leading-relaxed">
                  This app uses your OpenAI API key directly. Get your key from{" "}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#22D3EE] hover:text-[#1DD4ED] underline underline-offset-2 inline-flex items-center gap-1 transition-colors"
                  >
                    OpenAI
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#2A3242]/50" />

          {/* API Key Input Section */}
          <div className="space-y-3">
            <Label 
              htmlFor="openai-key" 
              className="text-[#E6E9EF] font-medium text-sm flex items-center gap-2"
            >
              <Key className="w-4 h-4 text-[#22D3EE]" />
              OpenAI API Key
            </Label>
            <div className="relative max-w-full">
              <Input
                id="openai-key"
                type={showOpenaiKey ? "text" : "password"}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-[#0B0E14] border-[#2A3242] text-[#E6E9EF] placeholder:text-[#6B7280] pr-14 h-12 text-sm leading-normal focus:border-[#22D3EE]/50 focus:ring-1 focus:ring-[#22D3EE]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-12 h-full text-[#9AA3B2] hover:text-[#E6E9EF] transition-colors hover:bg-[#2A3242]/30"
                aria-label={showOpenaiKey ? "Hide API key" : "Show API key"}
              >
                {showOpenaiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Used for meal suggestions, nutritional analysis, and menu parsing
            </p>
            
            {/* Remove/Delete Actions */}
            {(openaiKey.trim() !== "" || hasApiKey) && (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#9AA3B2] hover:text-[#E6E9EF] hover:bg-[#2A3242]/30 rounded-lg transition-colors"
                  disabled={isSaving}
                >
                  <X className="w-3.5 h-3.5" />
                  Remove from Field
                </button>
                {hasApiKey && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                    disabled={isSaving}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Permanently
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Save Status */}
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border backdrop-blur-sm ${
              saveStatus === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            <div className="flex items-center gap-3">
              {saveStatus === "success" ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{message}</span>
            </div>
          </motion.div>
        )}

        {/* Save Button */}
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="w-full max-w-full h-11 bg-gradient-to-r from-[#22D3EE] to-[#14B8A6] hover:from-[#1DD4ED] hover:to-[#0EA5E9] text-[#0B0E14] font-semibold text-sm shadow-lg shadow-[#22D3EE]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-[#0B0E14] border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save API Key
              </>
            )}
          </Button>
        </div>

        {/* Security Note */}
        <div className="bg-[#1E293B]/40 border border-[#334155]/60 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <Lock className="w-5 h-5 text-[#22D3EE] flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#E6E9EF]">Security & Privacy</p>
              <p className="text-xs text-[#9AA3B2] leading-relaxed">
                Your API key is stored locally in your browser's localStorage. It is only sent to OpenAI 
                when making API requests. We never store or access your key on our servers.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
