"use client"

import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

export const Social = () => {
  return (
    <div className="flex items-center w-full gap-x-2">
      <button
        className="flex-1 flex items-center justify-center gap-2 p-2 border rounded-md hover:bg-gray-100"
        onClick={() => console.log("Google login")}
      >
        <FcGoogle className="w-6 h-6" />
        <span>Google</span>
      </button>

      <button
        className="flex-1 flex items-center justify-center gap-2 p-2 border rounded-md hover:bg-gray-100"
        onClick={() => console.log("GitHub login")}
      >
        <FaGithub className="w-6 h-6" />
        <span>GitHub</span>
      </button>
    </div>
  );
};
