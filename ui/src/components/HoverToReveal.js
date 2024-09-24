import React, { useState } from "react";

const HoverToReveal = ({ text }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsRevealed(true)}
      onMouseLeave={() => setIsRevealed(false)}
      className="hover-to-reveal"
    >
      {isRevealed ? text : "Hover to See PrivateKey (MAKE SURE TO BACK IT UP)"}
    </div>
  );
};

export default HoverToReveal;
