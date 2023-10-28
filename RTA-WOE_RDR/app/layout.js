"use client";
import Navbar from "./components/Navbar";
import "./globals.css";
import { Inter } from "next/font/google";
import { AuthContextProvider, UserAuth } from "./context/AuthContext";
import { ModalContextProvider, useModal } from "./context/ModalContext";
import Modal from "./components/Modal";
import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ISBCS",
  description: "Intermediary System Between CanvasLMS and StepFunctions",
};


export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ModalContextProvider>
          <AuthContextProvider>
            <App children={children} AWS={AWS}/>
          </AuthContextProvider>
        </ModalContextProvider>
      </body>
    </html>
  );
}

function App({ children }) {
  const { modalConfig } = useModal();
  const { user, googleSignIn } = UserAuth();

  const handleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {user ? (
        <div>
          <Navbar />
          {children}
          {modalConfig.isOpen && <Modal componentName={modalConfig.componentName} componentProps={modalConfig.componentProps} />}
        </div>
      ) : (
        <AuthModal handleSignIn={handleSignIn} />
      )}
    </>
  );
}

function AuthModal({ handleSignIn }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-8 bg-gray-200 rounded-xl shadow-md">
        <h2 className="text-center text-2xl font-extrabold text-gray-900">Iniciar sesión o registrarse</h2>
        <div className="mt-8 space-y-4">
          <button
            onClick={handleSignIn}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Iniciar sesión
          </button>
          <button
            onClick={handleSignIn}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Registrarme
          </button>
        </div>
      </div>
    </div>
  );
}
