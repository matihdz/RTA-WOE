import React, { createContext, useState, useContext } from "react";

const ModalContext = createContext();

export const ModalContextProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    componentName: null,
    componentProps: null,
  });

  return <ModalContext.Provider value={{ modalConfig, setModalConfig }}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalContextProvider");
  }
  return context;
};
