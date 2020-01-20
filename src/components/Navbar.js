import React, { useState } from 'react';
import { Auth } from 'aws-amplify';
import {
  //Button,
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  NavbarText
} from 'reactstrap';

const MainNavbar = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  
  const handleLogOut = async event => {
    //event.preventDefault();   ------this line was keeping the history.push from executing.  WHy?
    try {
      Auth.signOut();
      props.auth.setAuthStatus(false);
      props.auth.setUser(null);
      props.history.push('/');
    } catch (error) {
      console.log(error.message);
    }
  }
  
  return (
    <div>
      <Navbar color="light" light expand="md">
        <NavbarBrand href="/">
          <img src="waldenlogo.jpg" width="134" height="33" alt="walden logo" />
        </NavbarBrand>
        <NavbarToggler onClick={toggle} />
        <Collapse isOpen={isOpen} navbar>
          <Nav className="mr-auto" navbar>
            <NavItem>
              <NavLink href="/">Home</NavLink>
            </NavItem>
          
            {props.auth.isAuthenticated && (
              <NavItem>
                <NavLink href="/recipes">My Reipes</NavLink>
              </NavItem>
            )}  
          </Nav>
          
          <Nav className="ml-auto" navbar>
            {props.auth.isAuthenticated && props.auth.user && (
              <NavbarText>Hello, {props.auth.user.username}.</NavbarText>
            )}
            {!props.auth.isAuthenticated && (
              <NavItem><NavLink href="/register"><strong>Register</strong></NavLink></NavItem>
            )}
            {!props.auth.isAuthenticated && (
              <NavItem><NavLink href="/login">Log in</NavLink></NavItem>
            )}
            {props.auth.isAuthenticated && (
              <a className="nav-item nav-link button" href="/" onClick={handleLogOut}><strong>Log out</strong></a>
            )}
          </Nav>
        </Collapse>
      </Navbar>
    </div>
  );
}



export default MainNavbar;


