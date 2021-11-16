import React, { useState } from "react";

const ZombieChar = ({ zombieDna }) => {
  const [isZombieLoading, setZombieLoading] = useState(true);
  setTimeout(() => {
    setZombieLoading(false);
  }, 1250);

  const currentHeadChoice = parseInt(zombieDna.substring(0, 2)) % 7 + 1;
  const currentEyeChoice = parseInt(zombieDna.substring(2, 4)) % 11 + 1;
  const currentShirtChoice = parseInt(zombieDna.substring(4, 6)) % 6 + 1;
  const currentSkinColorChoice = parseInt(zombieDna.substring(6, 8)) / 100 * 360;
  const currentEyeColorChoice = parseInt(zombieDna.substring(8, 10)) / 100 * 360;
  const currentClothesColorChoice = parseInt(zombieDna.substring(10, 12)) / 100 * 360;
  
  const headSrc = `/img/zombieparts/head-${currentHeadChoice}@2x.png`;
  const eyeSrc = `/img/zombieparts/eyes-${currentEyeChoice}@2x.png`;
  const shirtSrc = `/img/zombieparts/shirt-${currentShirtChoice}@2x.png`;

  const catMode = false;
  
  const headColor = () => getColor(currentSkinColorChoice);
  const eyeColor = () => getColor(currentEyeColorChoice);
  const clothesColor = () => getColor(currentClothesColorChoice);

  const getColor = (deg) => {
    return {
      filter: `hue-rotate(${deg}deg)`
    }
  }

  return (
    <div className="container">
      <div className="row justify-content-md-center">
        <div className="col-6 p-4 text-center">
        <div className="zombie-char">
          {isZombieLoading ? 
            <div className="zombie-loading zombie-parts" />
            :
            <div className="zombie-parts" >
              <img style={clothesColor()} hidden={!catMode} className="left-feet" src="/img/zombieparts/left-feet-1@2x.png" />
              <img style={clothesColor()} hidden={!catMode} className="right-feet" src="/img/zombieparts/right-feet-1@2x.png" />

              <img style={clothesColor()} hidden={!catMode} className="left-leg" src="/img/zombieparts/left-leg-1@2x.png" />
              <img style={clothesColor()} hidden={!catMode} className="right-leg" src="/img/zombieparts/right-leg-1@2x.png" />

              <img style={clothesColor()} hidden={!catMode} className="left-thigh" src="/img/zombieparts/left-thigh-1@2x.png" />
              <img style={clothesColor()} hidden={!catMode} className="right-thigh" src="/img/zombieparts/right-thigh-1@2x.png" />

              <img style={headColor()} className="left-forearm" src="/img/zombieparts/left-forearm-1@2x.png" />
              <img style={headColor()} className="right-forearm" src="/img/zombieparts/right-forearm-1@2x.png" />

              <img style={headColor()} className="right-upper-arm" src="/img/zombieparts/right-upper-arm-1@2x.png" />

              <img style={clothesColor()} className="torso" src="/img/zombieparts/torso-1@2x.png" />

              <img style={clothesColor()} hidden={catMode} className="cat-legs" src="/img/zombieparts/catlegs.png" />
              
              <img style={clothesColor()} className="shirt" src={shirtSrc} />

              <img style={headColor()} className="left-upper-arm" src="/img/zombieparts/left-upper-arm-1@2x.png" />

              <img style={headColor()} className="left-forearm" src="/img/zombieparts/left-forearm-1@2x.png" />
              <img style={headColor()} className="right-forearm" src="/img/zombieparts/right-forearm-1@2x.png" />

              <img style={headColor()} className="left-hand" src="/img/zombieparts/hand1-1@2x.png" />
              <img style={headColor()} className="right-hand" src="/img/zombieparts/hand-2-1@2x.png" />
                  
              <img style={headColor()} className="head" src={headSrc} />
              <img style={eyeColor()} className="eye" src={eyeSrc} />
              <img className="mouth" src="/img/zombieparts/mouth-1@2x.png" />
            </div>
          }
          </div>
        </div>
      </div>
    </div>
  );
}

export default ZombieChar;