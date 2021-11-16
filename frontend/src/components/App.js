import React from "react";
import { ethers } from "ethers";

import CryptoZombiesArtifact from "../contracts/CryptoZombies.json";
import contractAddress from "../contracts/contract-address.json";

import NoWalletDetected from "./NoWalletDetected";
import ConnectWallet from "./ConnectWallet";
import CreateZombie from "./CreateZombie";
import ZombieChar from "./ZombieChar";
import Loading from "./Loading";

const HARDHAT_NETWORK_ID = '31337';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      selectedAddress: undefined,
      cryptoZombies: undefined,
      userZombies: undefined,
      balance: undefined,
      networkError: undefined,
    };

    this.state = this.initialState;
  }

  render() {
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet 
          connectWallet={() => this.connectWallet()} 
          networkError={this.state.networkError}
          dismiss={() => this.dismissNetworkError()}
        />
      );
    }

    if (!this.state.userZombies) {
      return <Loading />;
    }

    if (this.state.userZombies.length === 0) {
      return <CreateZombie 
        createZombie={(name) => this.createZombie(name)}
      />;
    }

    return (
      <div className="App">
        <header className="App-header">
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }

  async connectWallet() {
    const [selectedAddress] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    if (!this.checkNetwork()) {
      return;
    }

    this.init(selectedAddress);

    window.ethereum.on("accountsChanged", ([newAddress]) => {
      if (newAddress === undefined) {
        return this.resetState();
      }
      
      this.init(newAddress);
    });

    window.ethereum.on("chainChanged", ([networkId]) => {
      this.resetState();
    });
  }

  async init(userAddress) {
    this.setState({
      selectedAddress: userAddress,
    });

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const cryptoZombies = new ethers.Contract(
      contractAddress.CryptoZombies,
      CryptoZombiesArtifact.abi,
      provider.getSigner(0)
    );

    console.log("Contract data: ", cryptoZombies);

    cryptoZombies.on("NewZombie", (zombieId, name, dna, event) => {
      console.log(`Created new zombie ${ name } with id=${ zombieId } and dna=${dna}`);
    });

    const filterTransferByUser = cryptoZombies.filters.Transfer(null, userAddress);
    cryptoZombies.on(filterTransferByUser, (from, to, tokenId, event) => {
        console.log(`I got zombie ${tokenId} from ${from}.`);
    });

    const filterAttackByUser = cryptoZombies.filters.Attack(null, userAddress);
    cryptoZombies.on(filterAttackByUser, (attacker, defender, zombieId, targetId, event) => {
        console.log(`Attack ${zombieId} from ${attacker}.`);
    });

    const userZombies = await cryptoZombies.getZombiesByOwner(userAddress);
    console.log(userZombies);
    this.setState({ userZombies, cryptoZombies });
  }

  async createZombie(name) {
    const { cryptoZombies } = this.state;
    await cryptoZombies.createRandomZombie(name);
  }

  // This method checks if Metamask selected network is localhost:8545 
  checkNetwork() {
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
      return true;
    }

    this.setState({ 
      networkError: 'Please connect Metamask to localhost:8545'
    });

    return false;
  }

  dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  resetState() {
    this.setState(this.initialState);
  }
}

export default App;
