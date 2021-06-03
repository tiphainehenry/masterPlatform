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
        if (this.state.auth.isAdmin) {
            var button = <Nav.Link href="/newrole">Manage roles</Nav.Link>
        }
        return <div>
            <Authentification status={this.getStatus}/>
            <div className="sidebar">
                <Nav className="col-md-12 d-none d-md-block sidebar"
                    activeKey="/home"
                >
                    <Nav.Link style={{ paddingTop: "5vh" }} href="/create">Import a Projection</Nav.Link>
                    <Nav.Link href="/new">Create a new projection</Nav.Link>
                    <Nav.Link href="/edit">Edit a projection</Nav.Link>
                    {button}
                </Nav>
            </div>
        </div>

    }

}
export default withRouter(SidebarModel)

