import React from "react";
import Hero from "./Hero";
import Screenshot from "./Screenshot";
import Feature from "./Feature";

const LandingPage = () => {
  return (
    <div className="w-full h-full bg-[#0f0f0f]">
      <Hero />
      <Screenshot />
      <Feature />
    </div>
  );
};

export default LandingPage;
