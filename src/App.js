import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';
import React, { useEffect, useState } from "react";
import contractABI from './utils/contractABI.json';
import { ethers } from "ethers";
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const tld = '.jhv';
const CONTRACT_ADDRESS = '0xf154bC56f5399675F5164FFE14Dc410E47104bDd';

const App = () => {
  	const [currentAccount, setCurrentAccount] = useState('');
  	const [domain, setDomain] = useState('');
  	const [record, setRecord] = useState('');
  	const [network, setNetwork] = useState('');

  	const connectWallet = async () => {
    	try {
      	const { ethereum } = window;

      	if (!ethereum) {
        	alert("Get MetaMask -> https://metamask.io/");
        	return;
      	}
			
      	const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      
      	console.log("Connected", accounts[0]);
      	setCurrentAccount(accounts[0]);
    	} catch (error) {
      		console.log(error)
    	}
  	}
	const switchNetwork = async () => {
		if (window.ethereum) {
			try {
				// Try to switch to the Mumbai testnet
				await window.ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: '0x13881' }], // Check networks.js for hexadecimal network ids
				});
			} catch (error) {
				if (error.code === 4902) {
					try {
						await window.ethereum.request({
							method: 'wallet_addEthereumChain',
							params: [
								{	
									chainId: '0x13881',
									chainName: 'Polygon Mumbai Testnet',
									rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
									nativeCurrency: {
											name: "Mumbai Matic",
											symbol: "MATIC",
											decimals: 18
									},
									blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
								},
							],
						});
					} catch (error) {
						console.log(error);
					}
				}
				console.log(error);
			}
		} else {
			// If window.ethereum is not found then MetaMask is not installed
			alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
		} 
	}



	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;

		if (!ethereum) {
			console.log('Make sure you have metamask!');
			return;
		} else {
			console.log('We have the ethereum object', ethereum);
		}

		const accounts = await ethereum.request({ method: 'eth_accounts' });

		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			setCurrentAccount(account);
		} else {
			console.log('No authorized account found');
		}

		const chainId = await ethereum.request({ method: 'eth_chainId' });
		setNetwork(networks[chainId]);

		ethereum.on('chainChanged', handleChainChanged);
		
		// Reload the page when they change networks
		function handleChainChanged(_chainId) {
			window.location.reload();
		}
	};

	const mintDomain = async () => {
		// Don't run if the domain is empty
		if (!domain) { return }
		if (domain.length < 3) {
			alert('Domain must be at least 3 characters long');
			return;
		}

		// Calculate price based on length of domain
		// 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
		const price = domain.length === 3 ? '0.5' : domain.length === 4 ? '0.3' : '0.1';
		console.log("Minting domain", domain, "with price", price);
	  try {

			const { ethereum } = window;
			if (ethereum) {
			  const provider = new ethers.providers.Web3Provider(ethereum);
			  const signer = provider.getSigner();
			  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);
			
				console.log("Going to pop wallet now to pay gas...")
			  let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)});
				const receipt = await tx.wait();
				if (receipt.status === 1) {
					console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+tx.hash);

					// Set the record for the domain
					tx = contract.setRecord(domain, record);
					await tx.wait();
					console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx.hash);

					setRecord('');
					setDomain('');
				}
				else {
					alert("Transaction failed! Please try again");
				}
			}
	  } catch(error){
			console.log(error);
	  }
	}

	// Render methods
	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<img src="https://media.giphy.com/media/3ohhwytHcusSCXXOUg/giphy.gif" alt="Ninja donut gif" />
      {/* Call the connectWallet function we just wrote when the button is clicked */}
			<button onClick={connectWallet} className="cta-button connect-wallet-button">
				Connect Wallet
			</button>
		</div>
	);
	
	// Form to enter domain name and data
	const renderInputForm = () => {
		if (network !== 'Polygon Mumbai Testnet') {
			return (
				<div className="connect-wallet-container">
					<p>Please connect to the Polygon Mumbai Testnet</p>
				</div>
			);
		}
		return (
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder="domain"
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>
	
				<input
					type="text"
					value={record}
					placeholder='whats ur ninja power?'
					onChange={e => setRecord(e.target.value)}
				/>
	
				<div className="button-container">
					{/* Call the mintDomain function when the button is clicked*/}
					<button className='cta-button mint-button' onClick={mintDomain}>
						Mint
					</button> 
				</div>
	
			</div>
		);
	}
  
	useEffect(() => {
		checkIfWalletIsConnected();
	}, []);

	return (
		<div className="App">
			<div className="container">
				<div className="header-container">
					<header>
						<div className="left">
							<p className="title">🐱‍👤 Kewl Domain Name Service</p>
							<p className="subtitle">Your immortal API on the blockchain!</p>
						</div>
						{/* Display a logo and wallet connection status*/}
						<div className="right">
							<img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
							{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
						</div>
					</header>
				</div>
				
				{!currentAccount && renderNotConnectedContainer()}{!currentAccount && renderNotConnectedContainer()}{!currentAccount && renderNotConnectedContainer()}
				{/* Render the input form if an account is connected */}
				{currentAccount && renderInputForm()}
				
				<div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built with @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
};

export default App;
