import React from 'react';
import '../css/Navbar.css';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaSteam } from "react-icons/fa";

function Navbar() {
    const routes = [ { path: '/', name: 'home' }, { path: '/overview', name: 'overview' }, { path: '/backlog', name: 'backlog' } ]
    const [ authenticated, setAuthenticated ] = useState(!!localStorage.getItem('steamid'));

    const handleStorage = () => {
        setAuthenticated(!!localStorage.getItem('steamid'));
    }
    /* Check for storage changes */
    useEffect(() => {
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    const setAuthNavbar = () => (
        <>
            {routes.map(route => (
                <li key={route.name} className='nav-item'>
                    <Link to={route.path} className='nav-link'>{route.name}</Link>
                </li>
            ))}


        </>
    )
    const setGuestNavbar = () => (
        <li key={routes[ 0 ].name} className='nav-item'>
            <Link to={routes[ 0 ].path} className='nav-link'>{routes[ 0 ].name}</Link>
        </li>
    )
    const getNavbarContent = () => authenticated ? setAuthNavbar() : setGuestNavbar();
    return (
        <div className='nav navbar'>
            <h2 className="navbar-brand"><FaSteam size={25}/> Steam Backlogify</h2>
            <ul className='navbar-group'>
                {getNavbarContent()}
            </ul>
            {authenticated ? (
                <div className="navbar-profile-wrapper">
                    <span className="nav-username">{localStorage.getItem('username')}</span>
                    <img className="nav-avatar" src={localStorage.getItem('avatar')} alt="avatar" />
                </div>
            ) : ''}

        </div >
    )
}

export default Navbar;