import React from "react";

const CreateZombie = ({ createZombie }) => {
  return (
    <div className="container">
      <div className="row justify-content-md-center">
        <div className="col-6 p-4 text-center">
          <p>Please create your first zombie.</p>
          <button
            className="btn btn-warning"
            type="button"
            onClick={() => createZombie("Stubbs")}
          >
            Create Zombie
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateZombie;