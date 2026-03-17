import React, { useEffect, useState } from "react";
import { getSocietyProfile } from "../../services/apiService";

const SubAdminTopBar = () => {
  const [societyName, setSocietyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSociety = async () => {
      try {
        const result = await getSocietyProfile();
        const profile = result?.profile || result?.data || result;
        const name = profile?.name || "";
        const logo = profile?.society_logo || "";
        setSocietyName(name);
        setLogoUrl(logo);
      } catch (e) {
        console.error("Failed to load society profile in top bar:", e);
      } finally {
        setLoading(false);
      }
    };

    loadSociety();
  }, []);

  return (
    <header className="h-16 pl-14 pr-4 sm:px-6 border-b border-gray-200 bg-white flex items-center justify-between shadow-sm">
      <div className="flex flex-col justify-center">
        <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
          Societies Dashboard
        </span>
        
      </div>

      <div className="flex items-center gap-2 sm:gap-3 ml-auto min-w-0">
        <div className="flex flex-col items-end mr-1 min-w-0">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            Society
          </span>
          <span className="text-sm font-medium text-gray-800 max-w-[120px] sm:max-w-[200px] truncate">
            {loading ? "Loading..." : societyName || "Not set"}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2F3D57] to-[#ED7600] text-white flex items-center justify-center text-sm font-semibold shadow-md overflow-hidden">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={societyName || "Society logo"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{(societyName || "?").charAt(0).toUpperCase()}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default SubAdminTopBar;
