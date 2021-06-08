import '../style/Dashboard.css'
import React from "react";
import { Nav } from "react-bootstrap";
import { withRouter } from "react-router";

import '../style/boosted.min.css';
import Authentification from './Authentification';


/**
 * Component to access graph edition / creation functionalities. 
 */
class SidebarModel extends React.Component {

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
        var importBtn = []
        if (this.state.auth.isAdmin) {
            var roleBtn = <Nav.Link href="/newrole">Manage roles</Nav.Link>
            importBtn.push(<Nav.Link style={{paddingTop:"5vh"}} href="/createG">Import a Projection - Global to Local</Nav.Link>)
            importBtn.push( <Nav.Link href="/createL">Import a Projection - Local to Global</Nav.Link>)
        }
        return <div>
            <Authentification status={this.getStatus}/>
            <div className="sidebar">
                <Nav className="col-md-12 d-none d-md-block sidebar"
                    activeKey="/home"
                >
                    {importBtn}
                    {/* <Nav.Link style={{paddingTop:"5vh"}} href="/createG">Import a Projection - Global to Local</Nav.Link>
                    <Nav.Link href="/createL">Import a Projection - Local to Global</Nav.Link> */}
                    <Nav.Link style={{paddingTop: !this.state.auth.isAdmin ? "5vh" : 'none'}} href="/new">Create a new projection</Nav.Link>
                    <Nav.Link href="/edit">Edit a projection</Nav.Link>
                    {roleBtn}
                </Nav>
            </div>
        </div>

    }

}
export default withRouter(SidebarModel)

