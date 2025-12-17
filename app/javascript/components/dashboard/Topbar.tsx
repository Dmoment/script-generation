import React from "react";

interface TopbarProps {
  user: {
    name?: string;
    email?: string;
    image?: string;
  } | null;
  gender?: "male" | "female" | "other" | null;
  onLogout: () => void;
  onMenuClick?: () => void;
}

/**
 * Get avatar based on gender
 */
const getAvatarByGender = (
  gender?: "male" | "female" | "other" | null
): string => {
  switch (gender) {
    case "female":
      return "/videos/girl_avatar.png";
    case "male":
    case "other":
    default:
      return "/videos/boy_avatar.png";
  }
};

/**
 * Topbar Component
 */
const Topbar: React.FC<TopbarProps> = ({ user, gender, onLogout, onMenuClick }) => (
  <div className="bg-[#FAF5ED] border-b-2 border-black relative">
    <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6 relative z-10">
      {/* Header image - hidden on mobile, smaller on tablet */}
      <div className="absolute left-0 top-0 bottom-0 w-1/4 md:w-1/3 overflow-hidden hidden sm:block">
        <img
          src="/videos/dashboard_header.png"
          alt="Dashboard Header"
          className="h-full w-full object-cover object-left"
          style={{ transform: "scale(1.0)", transformOrigin: "left center" }}
        />
      </div>
      <div className="w-1/4 md:w-1/3 hidden sm:block"></div>
      
      {/* Mobile: Compact layout */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-6">
        {/* Mobile Hamburger Menu Button - on the left */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 bg-white border-2 border-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex-shrink-0"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
        {/* Active Session - smaller on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-black">
            <span className="sm:hidden">Active</span>
            <span className="hidden sm:inline">Active Session</span>
          </span>
        </div>

        {/* User info and avatar - compact on mobile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right hidden lg:block">
            <div className="text-xs font-bold uppercase text-black">
              {user?.name || "User"}
            </div>
            <div className="text-[10px] font-mono text-gray-500 uppercase">
              {user?.email}
            </div>
          </div>
          {user?.image ? (
            <img
              alt="avatar"
              src={user.image}
              className="h-16 w-14 sm:h-20 sm:w-16 md:h-28 md:w-24 border-2 border-black grayscale"
            />
          ) : (
            <img
              alt="avatar"
              src={getAvatarByGender(gender)}
              className="h-16 w-12 sm:h-20 sm:w-16 md:h-28 md:w-20"
            />
          )}
        </div>

        {/* Logout button - door exit icon on mobile, text on desktop */}
        <button
          onClick={onLogout}
          className="px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider border-2 border-black hover:bg-black hover:text-white transition-colors flex items-center gap-1.5"
          title="Logout"
        >
          <span className="hidden sm:inline">Eject</span>
          <span className="sm:hidden">
            <i className="bi bi-box-arrow-right text-lg"></i>
          </span>
        </button>
      </div>
    </div>
  </div>
);

export default Topbar;
