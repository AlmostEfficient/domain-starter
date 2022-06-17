import React, { useEffect, useState } from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import {ethers} from "ethers";

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_HANDLE2 = 'b8n4s8n1'
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TWITTER_LINK2 =  `https://twitter.com/${TWITTER_HANDLE2}`;
const tld = '.666';
const CONTRACT_ADDRESS = '0x0ACf584F0807c6a6591077202b0892dCf6a822af';

const App = () => {
	const [currentAccount, setCurrentAccount] = useState('');

	const [domain, setDomain] = useState('');
const [record, setRecord] = useState('');	

	const connectWallet = async () => {
		try {
			const { ethereum } = window;

			if (!ethereum) {
				alert("Get Metamask -> https://metamask.io/");
				return;
			}

			const accounts = await ethereum.request({ method: "eth_requestAccounts"});
			
			console.log("connected", accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.log(error)
		}
	}
	
	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;
		
		if (!ethereum) {
			console.log("Install Metamask");
			return;
		} else {
			console.log("We have the ethereum object", ethereum);
		}
		const accounts = await ethereum.request({ method: 'eth_accounts' });

		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			setCurrentAccount(account);
		  } else {
			console.log('No authorized account found');
		  }
	};

	const mintDomain = async () => {
		// Don't run if the domain is empty
		if (!domain) { return }
		// Alert the user if the domain is too short
		if (domain.length < 3) {
			alert('Domain must be at least 3 characters long');
			return;
		}
		// Calculate price based on length of domain (change this to match your contract)	
		// 3 chars = 0.5 MATIC, 4 chars = 0.3 MATIC, 5 or more = 0.1 MATIC
		const price = domain.length === 3 ? '0.5' : domain.length === 4 ? '0.3' : '0.1';
		console.log("Minting domain", domain, "with price", price);
	  try {
		const { ethereum } = window;
		if (ethereum) {
		  const provider = new ethers.providers.Web3Provider(ethereum);
		  const signer = provider.getSigner();
		  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
	
				console.log("Going to pop wallet now to pay gas...")
		  let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)});
		  // Wait for the transaction to be mined
				const receipt = await tx.wait();
	
				// Check if the transaction was successfully completed
				if (receipt.status === 1) {
					console.log("Domain minted! https://mumbai.polygonscan.com/tx/"+tx.hash);
					
					// Set the record for the domain
					tx = await contract.setRecord(domain, record);
					await tx.wait();
	
					console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx.hash);
					
					setRecord('');
					setDomain('');
				}
				else {
					alert("Transaction failed! Please try again");
				}
		}
	  }
	  catch(error){
		console.log(error);
	  }
	}

	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
      <img src="https://media1.giphy.com/media/KSzxFSCApjqOOI1A9q/giphy.gif?cid=ecf05e47abb33ozp6jpk590d0o6wicf0lmgnjajn9m8myywh&rid=giphy.gif&ct=g" alt="Ninja gif" />
      <button onClick={connectWallet} className="cta-button connect-wallet-button">
        Connect Wallet
      </button>
    </div>
    );

	// Form to enter domain name and data
	const renderInputForm = () =>{
		return (
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder='domain'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>

				<input
					type="text"
					value={record}
					placeholder='for the record....'
					onChange={e => setRecord(e.target.value)}
				/>

				<div className="button-container">
					<button className='cta-button mint-button' onClick={}>
						Mint
					</button>   
				</div>

			</div>
		);
	}
	
	useEffect(() => {
		checkIfWalletIsConnected();
	  }, [])
	

  return (
		<div className="App">
			<div className="container">

				<div className="header-container">
					<header>
            <div className="left">
              <p className="title">😈 S.A.T.A. N. S.</p>
              <p className="subtitle"> ______(DOMAIN)^ </p>
            </div>
					</header>
				</div>

				{!currentAccount && renderNotConnectedContainer()}
				{currentAccount && renderInputForm()}


        <div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK} 
						target="_blank"
						rel="noreferrer"
					>{`built with <3 by @${TWITTER_HANDLE}`}</a><a
					className="footer-text"
					href={TWITTER_LINK2} 
					target="_blank"
					rel="noreferrer"
				>{`_& @${TWITTER_HANDLE2}`}</a>
				</div>
			</div>
		</div>
	);
}

export default App;
