import '../style/Dashboard.css'
import React from "react";
import { Nav } from "react-bootstrap";
import { withRouter } from "react-router";

import '../style/boosted.min.css';


/**
 * Component to access graph edition / creation functionalities. 
 */
class SidebarModel extends React.Component {


    render() {

        return <div>

            <div className="sidebar">
                <Nav className="col-md-12 d-none d-md-block sidebar"
                    activeKey="/home"

                //onSelect={selectedKey => alert(`selected ${selectedKey}`)}
                >
                    <Nav.Link style={{paddingTop:"5vh"}} href="/create">Import a Projection</Nav.Link>
                    <Nav.Link href="/new">Create a new projection</Nav.Link>
                    <Nav.Link href="/edit">Edit a projection</Nav.Link>

                </Nav>
            </div>
        </div>

    }

}
export default withRouter(SidebarModel)

