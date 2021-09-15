import React from 'react';
import { Accordion } from 'react-bootstrap';
import '../style/boosted.min.css';

/**
 * Component ...
 */

class Legend extends React.Component {

  render() {
    return <div style={{'paddingTop':'2rem'}}>

<Accordion>

  <ul className="nav nav-tabs nav-tabs-light">
          <li className="nav-item">
          <Accordion.Toggle eventKey="0" style={{'backgroundColor':'white'}}>
          <u className="nav-link active" data-toggle="tab">Help</u>
          </Accordion.Toggle>

          </li>
        </ul>
        <Accordion.Collapse eventKey="0">
    
        <div className="tab-content border-left-0 border-right-0 border-bottom-0">
          <div className="tab-pane active" id="help">
          <ul>
            {((this.props.src==='creation-deck') || (this.props.src==='edition-deck'))?<>
            <li><u>How do I add an activity?</u>
            <p>From this view, you can create a process from scratch. Right click on the deck to add an activity.</p>
            <p>You can customize the activity using the right-hand-side deck: choose the activity name, roles, and initial markings.</p>
            </li>
            <li><u>How do I add a relation?</u>
            <p>You can also constraint activities together by clicking on each activity once, and then right click to choose the desired relation.</p>
            
            <ul>
            <li><u>Pre-execution constraints</u></li>
            <ul>
            <li style={{ color: "#29A81A"}}><u>Include</u></li>
            <li style={{ color: "#FF0000"}}><u>Exclude</u></li>
            <li style={{ color: "#1E90FF"}}><u>Response</u></li>

          </ul>

            <li><u>Post-execution constraints</u></li>
            <ul>
            <li><u style={{ color: "#FFA500"}}>Condition</u></li>

            <li><u style={{ color: "#BC1AF2"}}>Milestone</u></li>
          </ul>

          </ul>

            
            </li>
            <li><u>How do I save a process model?</u>
            <p>Save the new process model to the library (button save), or/and create an instance by loading the public view in the blockchain.</p>
            </li></>: 

            <>
            <li><u>Pre-execution constraints</u></li>
            <ul>
            <li style={{ color: "#29A81A"}}><u>Include</u></li>
            <li style={{ color: "#FF0000"}}><u>Exclude</u></li>
            <li style={{ color: "#1E90FF"}}><u>Response</u></li>

          </ul>
          <li><u>Post-execution constraints</u></li>
            <ul>
            <li><u style={{ color: "#FFA500"}}>Condition</u></li>

            <li><u style={{ color: "#BC1AF2"}}>Milestone</u></li>
          </ul>

          </>
          }
              
            </ul>
        
          </div>
        </div>
        </Accordion.Collapse>


{/*<Navbar  collapseOnSelect expand="lg" bg="dark" variant="dark"  className="navbar navbar-expand-lg navbar-light bg-light flex-md-nowrap rounded">
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav >
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
  </Navbar>*/}

</Accordion>

    </div>
      ;
  }
}

export default Legend

