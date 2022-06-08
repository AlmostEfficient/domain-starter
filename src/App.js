import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import contractAbi from "./utils/contractABI.json";
import polygonLogo from "./assets/polygonlogo.png";
import ethLogo from "./assets/ethlogo.png";
import { networks } from "./utils/networks";

import MetaMaskButton from "./components/MetaMaskButton";
import GradientButton from "./components/GradientButton";
import EditButton from "./components/EditButton";
import Spinner from "./components/Spinner";

const tld = ".dum";
const CONTRACT_ADDRESS = "0x6661a90f339411d81E4c31028D1C7cCB9f472B0f";

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
    setLoading(true);
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
          contractAbi,
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

          if (record !== "") {
            tx = await contract.setRecord(domain, record);
            await tx.wait();

            console.log(
              "Record set! https://mumbai.polygonscan.com/tx/" + tx.hash
            );
          }

          fetchMints();
          setRecord("");
          setDomain("");
        } else {
          alert("Transaction failed! Please try again.");
        }
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi,
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

  const updateRecord = async () => {
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractAbi,
          signer
        );

        let tx = await contract.setRecord(domain, record);
        await tx.wait();
        console.log("Record set https://mumbai.polygonscan.com/tx/" + tx.hash);

        fetchMints();
        setRecord("");
        setDomain("");
        setEditing(false);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
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

  const renderNotConnectedContainer = () => (
    <div className="mt-28">
      <h2 className="text-white text-center text-[26px] font-semibold tracking-wider">
        Welcome to the Dum Name Service!
        <br />
        Please connect your wallet.
      </h2>
      <div className="flex justify-center">
        <MetaMaskButton connectWallet={connectWallet} />
      </div>
    </div>
  );

  const renderInputForm = () => {
    if (network !== "Polygon Mumbai Testnet") {
      return (
        <div className="mt-28">
          <h2 className="text-white text-[26px] font-semibold tracking-wider">
            Please switch to the Polygon Mumbai Testnet
          </h2>
          <div className="flex justify-center">
            <GradientButton
              handleClick={switchNetwork}
              label="Click Here to Switch"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="w-1/3 mt-32 mb-28 flex flex-col justify-center">
        <div className="w-full flex items-center relative mb-4">
          <label className="sr-only">Domain</label>
          <input
            type="text"
            className="w-full p-2 text-lg text-center font-medium border-none bg-gray-900 text-white disabled:text-gray-400 disabled:italic disabled:cursor-not-allowed rounded-lg focus:ring-0 focus:ring-offset-0"
            value={domain}
            disabled={loading || editing}
            placeholder="domain"
            onChange={(e) => setDomain(e.target.value)}
          />
          <span className="absolute right-5 font-medium text-gray-500">
            {tld}
          </span>
        </div>
        <input
          type="text"
          className="w-full p-2 text-lg text-center font-medium border-none bg-gray-900 text-white disabled:text-gray-300 disabled:italic rounded-lg focus:ring-0 focus:ring-offset-0"
          value={record}
          disabled={loading}
          placeholder="record"
          onChange={(e) => setRecord(e.target.value)}
        />
        {editing ? (
          <div className="flex justify-evenly">
            <GradientButton
              loading={loading}
              handleClick={updateRecord}
              label={loading ? "Updating..." : "Update Record"}
            />
            <GradientButton
              loading={loading}
              handleClick={() => {
                setEditing(false);
                setDomain("");
                setRecord("");
              }}
              label="Cancel"
            />
          </div>
        ) : (
          <div className="mx-auto">
            <GradientButton
              loading={loading}
              handleClick={mintDomain}
              label={loading ? "Minting..." : "Mint"}
            />
          </div>
        )}
        <div className="flex justify-center">{loading && <Spinner />}</div>
      </div>
    );
  };

  const renderMints = () => {
    if (currentAccount && mints.length > 0) {
      return (
        <div className="w-3/4 flex flex-col items-center">
          <h2 className="text-white text-[26px] font-semibold tracking-wider uppercase mb-6">
            Minted domains
          </h2>
          <div className="flex justify-center flex-wrap">
            {mints.map((mint, index) => {
              let bgColor;
              if ((index + 3) % 3 === 0) {
                bgColor = "bg-gradient-to-br from-purple-600 to-blue-500";
              } else if ((index + 3) % 3 === 1) {
                bgColor = "bg-gradient-to-br from-purple-500 to-pink-500";
              } else if ((index + 3) % 3 === 2) {
                bgColor = "bg-gradient-to-br from-pink-500 to-orange-400";
              }
              return (
                <div
                  className={`${bgColor} m-4 p-0.5 rounded-xl text-white drop-shadow-[10px_10px_10px_rgba(0,0,0,0.35)]`}
                  key={index}
                >
                  <div
                    className={`bg-[#171f2d] hover:${bgColor} p-4 rounded-xl`}
                  >
                    <div className="flex">
                      <a
                        href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <p className="font-semibold text-lg underline">
                          {mint.name}
                          {tld}
                        </p>
                      </a>
                      {mint.owner.toLowerCase() ===
                      currentAccount.toLowerCase() ? (
                        <EditButton
                          handleClick={() => editRecord(mint.name, mint.record)}
                        />
                      ) : null}
                    </div>
                    <p className="font-medium text-md italic">
                      {mint.record ? mint.record : <br />}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <header className="mt-10 w-11/12">
        <div className="flex flex-row justify-between ">
          <div>
            <h1 className="text-white font-bold text-3xl">
              Dum Name Service
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
