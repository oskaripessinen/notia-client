import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'
import AuthModal from '../components/AuthModal';
import '../styles/frontPage.css';


function FrontPage() {
	const [isModalOpen, setModalOpen] = useState(false);
	const [modalType, setModalType] = useState("login");

	const toggleModalType = (newType) => {
		
		setModalType(newType);
		
	};
  
	return (
		<div className="frontpage-container">
			<header className="frontpage-header">
				<h1>Notia</h1>
				<div className="header-content">
					<button className='login-button' onClick={() => {setModalType("login"); setModalOpen(true);}}>Log in</button>
					<button className='signup-button' onClick={() => {setModalType("signup"); setModalOpen(true);}}>Get Notia free</button>
				</div>
			</header>
			<div className="frontpage-content">
				<h2>Ideas & plans in one place.</h2>
				<h2>Welcome to Notia.</h2>
				<h3>Seamlessly connect your ideas with Notia.</h3>
				<button className='signup-button' style={{fontSize: "1rem", padding: "0.5rem", paddingLeft: "1.2rem", paddingRight: "1.1rem"}} onClick={() => {setModalType("signup"); setModalOpen(true);}}>
					Get Notia free <FontAwesomeIcon style={{marginLeft: "0.5rem"}} icon={faArrowRight}/>
				</button>
			</div>
			<AuthModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} type={modalType} onToggle={toggleModalType} />
		</div>
	);
}

export default FrontPage;
