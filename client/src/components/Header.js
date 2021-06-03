import React from 'react';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import '../style/boosted.min.css';
import Authentification from './Authentification';

/**
 * Component ...
 */
class Header extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      auth: {},
    }
    this.childElement = React.createRef()
    this.getStatus = this.getStatus.bind(this)
  }
  getStatus = auth => this.setState({ auth })

  render() {
    let links = []
    if (this.state.auth.isAdmin) {
      links.push(<Nav.Link href="/welcomeInstance">My Running Instances</Nav.Link>)
      links.push(<Nav.Link href="/welcomemodel">My Process Models </Nav.Link>)
    }
    return <div>
      <Authentification status={this.getStatus} />
      <Navbar style={{ 'position': 'fixed', 'width': '100%' }} collapseOnSelect expand="lg" bg="dark" variant="dark" sticky="top" className="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="mr-auto">
            <Nav.Link href="/">Homepage</Nav.Link>
            {links}
          </Nav>

          <Nav >
            {this.state.auth.isRole ? <Nav.Link style={{Color:"white"}}>Role: {this.state.auth.name}</Nav.Link> : null}
            <NavDropdown title="Constraints Legend" id="collasible-nav-dropdown">
              <NavDropdown.Item style={{ "fontSize": '16px' }}>Post-execution</NavDropdown.Item>
              <NavDropdown.Item style={{ color: "#29A81A", "fontSize": '12px' }}> -- Include</NavDropdown.Item>
              <NavDropdown.Item style={{ color: "#FF0000", "fontSize": '12px' }}> -- Exclude</NavDropdown.Item>
              <NavDropdown.Item style={{ color: "#1E90FF", "fontSize": '12px' }}> -- Response</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item style={{ "fontSize": '16px' }}>Pre-execution</NavDropdown.Item>
              <NavDropdown.Item style={{ color: "#FFA500", "fontSize": '12px' }}> -- Condition</NavDropdown.Item>
              <NavDropdown.Item style={{ color: "#BC1AF2", "fontSize": '12px' }}> -- Milestone</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

    </div>
      ;
  }
}

export default Header

