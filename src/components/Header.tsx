import { Apple, LogOut, User as UserIcon, Settings } from "lucide-react";

interface HeaderProps {
  authenticatedUser?: { id: string; email: string; name: string; picture?: string } | null;
  onLogout?: () => void;
  onSettingsClick?: () => void;
}

export function Header({ authenticatedUser, onLogout, onSettingsClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#121722]/60 border-b border-[#2A3242]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#22D3EE] to-[#14B8A6] flex items-center justify-center">
            <Apple className="w-5 h-5 text-[#0B0E14]" />
          </div>
          <span className="text-[#E6E9EF] font-semibold">NutriPlan</span>
        </div>
        <div className="flex items-center gap-4">
          {authenticatedUser ? (
            <>
              <div className="flex items-center gap-2">
                {authenticatedUser.picture ? (
                  <img
                    src={authenticatedUser.picture}
                    alt={authenticatedUser.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#22D3EE] to-[#14B8A6] flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-[#0B0E14]" />
                  </div>
                )}
                <span className="text-sm text-[#E6E9EF] hidden sm:inline">{authenticatedUser.name}</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg hover:bg-[#2A3242] text-[#9AA3B2] hover:text-[#E6E9EF] transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <>
              <span className="text-xs text-[#9AA3B2]">For Students & IT Professionals</span>
              {onSettingsClick && (
                <button
                  onClick={onSettingsClick}
                  className="p-2 rounded-lg hover:bg-[#2A3242] text-[#9AA3B2] hover:text-[#E6E9EF] transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
