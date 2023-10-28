import React from "react";
import Image from "next/image";
import loader from "../assets/spinner.gif";

const Spinner = ({ width = "inherit", height = "inherit" }) => {
  return (
    <div className={`flex items-center justify-center`} style={{ width, height }}>
      <Image src={loader} alt="loading.." />
    </div>
  );
};

export default Spinner;
