import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractAbi from "./utils/contractABI.json";
import polygonLogo from "./assets/polygonlogo.png";
import ethLogo from "./assets/ethlogo.png";
import { networks } from "./utils/networks";

import MetaMaskButton from "./components/MetaMaskButton";

const tld = ".chrundle";
const CONTRACT_ADDRESS = "0xA88501886c883b995b53E509a0186C726A692703";

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [domain, setDomain] = useState("");
  const [record, setRecord] = useState("");
  const [network, setNetwork] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [mints, setMints] = useState([]);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
    } else {
      console.log("No authorized account found.");
    }

    const chainId = await ethereum.request({ method: "eth_chainId" });
    setNetwork(networks[chainId]);

    ethereum.on("chainChanged", handleChainChanged);

    function handleChainChanged(_chainId) {
      window.location.reload();
    }
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13881" }],
        });
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x13881",
                  chainName: "Polygon Mumbai Testnet",
                  rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
                  nativeCurrency: {
                    name: "Mumbai Matic",
                    symbol: "MATIC",
                    decimals: 18,
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
                },
              ],
            });
          } catch (error) {
            console.error(error);
          }
        }
        console.error(error);
      }
    } else {
      alert(
        "MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html"
      );
    }
  };

  const mintDomain = async () => {
    if (!domain) {
      return;
    }
    if (domain.length < 3) {
      alert("Domain must be at least 3 characters long");
      return;
    }
    const price =
      domain.length === 3 ? "0.05" : domain.length === 4 ? "0.03" : "0.01";
    console.log("Minting domain", domain, "with price", price);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        console.log("Going to pop wallet now to pay gas...");
        let tx = await contract.register(domain, {
          value: ethers.utils.parseEther(price),
        });
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          console.log(
            "Domain minted! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          tx = await contract.setRecord(domain, record);
          await tx.wait();

          console.log(
            "Record set! https://mumbai.polygonscan.com/tx/" + tx.hash
          );

          setTimeout(() => {
            fetchMints();
          }, 2000);

          setRecord("");
          setDomain("");
        } else {
          alert("Transaction failed! Please try again.");
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        const names = await contract.getAllNames();

        const mintRecords = await Promise.all(
          names.map(async (name) => {
            const mintRecord = await contract.records(name);
            const owner = await contract.domains(name);
            return {
              id: names.indexOf(name),
              name: name,
              record: mintRecord,
              owner: owner,
            };
          })
        );

        console.log("Mints Fetched ", mintRecords);
        setMints(mintRecords);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateDomain = async () => {
    if (!record || !domain) {
      return;
    }
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi.abi,
          signer
        );

        let tx = await contract.setRecord(domain, record);
        await tx.wait();
        console.log("Record set https://mumbai.polygonscan.com/tx/" + tx.hash);

        fetchMints();
        setRecord("");
        setDomain("");
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const renderNotConnectedContainer = () => (
    <div className="mt-28">
      <MetaMaskButton connectWallet={connectWallet} />
    </div>
  );

  const renderInputForm = () => {
    if (network !== "Polygon Mumbai Testnet") {
      return (
        <div className="mt-24">
          <p className="text-white font-medium text-xl">
            Please switch to the Polygon Mumbai Testnet
          </p>
          <div className="flex justify-center">
            <button
              className="text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl font-medium rounded-lg text-large px-5 py-2.5 text-center mt-4"
              onClick={switchNetwork}
            >
              Click here to switch
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-1/3 my-32 flex flex-col justify-center">
        <div className="w-full flex items-center relative mb-4">
          <label className="sr-only">Domain</label>
          <input
            type="text"
            className="w-full p-2 text-lg text-center font-medium border-none bg-gray-900 text-white rounded-lg focus:ring-0 focus:ring-offset-0"
            value={domain}
            placeholder="domain"
            onChange={(e) => setDomain(e.target.value)}
          />
          <span className="absolute right-5 font-medium text-gray-500">
            {tld}
          </span>
        </div>
        <input
          type="text"
          className="w-full p-2 text-lg text-center font-medium border-none bg-gray-900 text-white rounded-lg focus:ring-0 focus:ring-offset-0"
          value={record}
          placeholder="record"
          onChange={(e) => setRecord(e.target.value)}
        />
        {editing ? (
          <div className="flex justify-evenly">
            <button
              className="text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl w-56 font-medium rounded-lg text-large px-5 py-2.5 text-center mt-8"
              disabled={loading}
              onClick={updateDomain}
            >
              Set record
            </button>
            <button
              className="text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl w-56 font-medium rounded-lg text-large px-5 py-2.5 text-center mt-8"
              onClick={() => {
                setEditing(false);
                setDomain("");
                setRecord("");
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="mx-auto">
            <button
              className="text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl w-56 font-medium rounded-lg text-large px-5 py-2.5 text-center mt-8"
              disabled={loading}
              onClick={mintDomain}
            >
              Mint
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderMints = () => {
    if (currentAccount && mints.length > 0) {
      return (
        <div className="border border-white w-3/4 flex flex-col items-center">
          <h2 className="text-white text-2xl font-semibold underline mb-4">
            Minted domains
          </h2>
          <div className="flex justify-center">
            {mints.map((mint, index) => {
              return (
                <div className="mint-item" key={index}>
                  <div className="mint-row">
                    <a
                      className="link"
                      href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <p className="underlined">
                        {" "}
                        {mint.name}
                        {tld}{" "}
                      </p>
                    </a>
                    {mint.owner.toLowerCase() ===
                    currentAccount.toLowerCase() ? (
                      <button
                        className="edit-button"
                        onClick={() => editRecord(mint.name, mint.record)}
                      >
                        <img
                          className="edit-icon"
                          src="https://img.icons8.com/metro/26/000000/pencil.png"
                          alt="Edit button"
                        />
                      </button>
                    ) : null}
                  </div>
                  <p>{mint.record}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  const editRecord = (name, record) => {
    setEditing(true);
    setDomain(name);
    setRecord(record);
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    if (network === "Polygon Mumbai Testnet") {
      fetchMints();
    }
  }, [currentAccount, network]);

  return (
    <div className="w-full flex flex-col items-center">
      <header className="mt-10 w-11/12">
        <div className="flex flex-row justify-between ">
          <div>
            <h1 className="text-white font-bold text-3xl">
              Chrundle Name Service
              <br />
              DNS on the Polygon Network
            </h1>
          </div>
          <div className="flex items-center bg-gray-800 text-white font-medium rounded-lg shadow-xl p-4">
            <img
              alt="Network logo"
              className="w-6 flex items-center mr-2"
              src={network.includes("Polygon") ? polygonLogo : ethLogo}
            />
            {currentAccount ? (
              <p>
                {" "}
                Wallet: {currentAccount.slice(0, 6)}...
                {currentAccount.slice(-4)}{" "}
              </p>
            ) : (
              <p> Not connected </p>
            )}
          </div>
        </div>
      </header>

      {!currentAccount && renderNotConnectedContainer()}
      {currentAccount && renderInputForm()}
      {mints && renderMints()}
    </div>
  );
};

export default App;
