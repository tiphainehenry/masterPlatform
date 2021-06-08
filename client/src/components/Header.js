import React from 'react';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import '../style/boosted.min.css';
import Authentification from './Authentification';
import createBrowserHistory from 'history/createBrowserHistory'

import { User } from 'react-feather';

/**
 * Component ...
 */

const history = createBrowserHistory({ forceRefresh: true });
class Header extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      auth: {},
    }
    this.childElement = React.createRef()
    this.getStatus = this.getStatus.bind(this)
  }
  getStatus = auth => {
    this.setState({ auth })
    if (!this.state.auth.isRole && window.location.pathname !== '/') {
      history.push("/")
    }
  }

  render() {
    let links = []
    if (this.state.auth.isAdmin) {
      links.push(<Nav.Link href="/welcomeInstance" class="nav-item" style={{ color: "white" }}>My Running Instances</Nav.Link>)
      links.push(<Nav.Link href="/welcomemodel" class="nav-item" style={{ color: "white" }}>My Process Models </Nav.Link>)
    }
    return <div>
      <Authentification status={this.getStatus} />
      <Navbar style={{ 'position': 'fixed', 'width': '100%' }} collapseOnSelect expand="lg" bg="dark" variant="dark" sticky="top" className="navbar navbar-expand-md navbar-dark bg-dark fixed-top flex-md-nowrap">
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="/" class="nav-item" style={{ color: "white" }}>Homepage</Nav.Link>
            {links}
          </Nav>

          <Nav >

            {this.state.auth.isRole ?
              <NavDropdown title={<>
                <User />
                <span>Hello <span class="text-primary">{this.state.auth.name}</span></span></>
              } id="collasible-nav-dropdown">
                <NavDropdown.Item style={{ "fontSize": '16px' }}><p>Admin : {this.state.auth.isAdmin ? "true" : "false"}</p>
                  <p>Role : {this.state.auth.isRole ? "true" : "false"}</p>

                </NavDropdown.Item>

              </NavDropdown>

              : null}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

    </div>
      ;
  }
}

export default Header

