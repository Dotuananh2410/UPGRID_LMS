import React from "react";

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Chevron (Lightest / Full Opacity) */}
      <path
        d="M 20 44 L 46 28 L 46 12 L 20 28 Z"
        fill="currentColor"
        className="opacity-100"
      />
      <path
        d="M 80 44 L 54 28 L 54 12 L 80 28 Z"
        fill="currentColor"
        className="opacity-100"
      />

      {/* Middle Chevron (Medium Opacity) */}
      <path
        d="M 20 68 L 46 52 L 46 36 L 20 52 Z"
        fill="currentColor"
        className="opacity-75"
      />
      <path
        d="M 80 68 L 54 52 L 54 36 L 80 52 Z"
        fill="currentColor"
        className="opacity-75"
      />

      {/* Bottom Chevron (Darkest / Low Opacity) */}
      <path
        d="M 20 92 L 46 76 L 46 60 L 20 76 Z"
        fill="currentColor"
        className="opacity-50"
      />
      <path
        d="M 80 92 L 54 76 L 54 60 L 80 76 Z"
        fill="currentColor"
        className="opacity-50"
      />
    </svg>
  );
};

export default Logo;
