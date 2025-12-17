import React from "react";

interface TopbarProps {
  user: {
    name?: string;
    email?: string;
    image?: string;
  } | null;
  gender?: "male" | "female" | "other" | null;
  onLogout: () => void;
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
const Topbar: React.FC<TopbarProps> = ({ user, gender, onLogout }) => (
  <div className="bg-[#FAF5ED] border-b-2 border-black relative">
    <div className="flex items-center justify-between px-8 py-6 relative z-10">
      <div className="absolute left-0 top-0 bottom-0 w-1/3 overflow-hidden">
        <img
          src="/videos/dashboard_header.png"
          alt="Dashboard Header"
          className="h-full w-full object-cover object-left"
          style={{ transform: "scale(1.0)", transformOrigin: "left center" }}
        />
      </div>
      <div className="w-1/3"></div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold uppercase tracking-wider text-black">
            Active Session
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
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
              className="h-28 w-24 border-2 border-black grayscale"
            />
          ) : (
            <img
              alt="avatar"
              src={getAvatarByGender(gender)}
              className="h-28 w-20"
            />
          )}
        </div>

        <button
          onClick={onLogout}
          className="ml-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 border-black hover:bg-black hover:text-white transition-colors"
          title="Logout"
        >
          Eject
        </button>
      </div>
    </div>
  </div>
);

export default Topbar;
