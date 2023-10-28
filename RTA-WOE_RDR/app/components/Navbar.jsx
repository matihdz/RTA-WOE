"use client";

import Link from "next/link";
import { UserAuth } from "../context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const Router = useRouter();
  const { user, logOut } = UserAuth();

  useEffect(() => {
    if (!user) Router.push("/");
    else Router.push("/rdr");
  }, [user]);

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-gray-300 h-16 shadow-sm flex items-center justify-between px-8">
      <ul className="flex space-x-4 items-center">
        {/* <li className="cursor-pointer text-gray-900 hover:text-blue-800">
          <Link href="/">ISBCS</Link>
        </li> */}
        <li className="cursor-pointer text-gray-900 hover:text-blue-800">
          <Link href="/rdr">RDRs</Link>
        </li>
      </ul>

      <div className="flex items-center space-x-4">
        <span className="text-gray-900">Bienvenido, {user.displayName}</span>
        <button onClick={handleSignOut} className="text-xs text-white bg-red-500 hover:bg-red-600 rounded py-1 px-2">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Navbar;
