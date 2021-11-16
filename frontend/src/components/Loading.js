import React from "react";

const Loading = () => {
  return (
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '10px',
        }}
        className="zombie-loading"
      />
  );
}

export default Loading;