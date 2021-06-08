import '../style/Dashboard.css'
import React from "react";
import { Nav } from "react-bootstrap";
import { withRouter } from "react-router";

import '../style/boosted.min.css';
import Authentification from './Authentification';

import { Users, FilePlus, Edit } from 'react-feather';


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
            var button = <div>                  <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                Role management
            </h6>
                <ul class="nav flex-column">
                    <li class="nav-item">
                        <a class="nav-link" href="/newrole">
                            <span> <Users /> Manage roles</span>


                        </a>
                    </li>
                </ul></div>
        }
        return <div>

            <Authentification status={this.getStatus} />

            <nav id="sidebarMenu" role="navigation" class="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
                <div class="sidebar-sticky pt-3">

                    {button}

                    <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                        Graph creation
                    </h6>

                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link" href="/new">
                                <span><Edit /> Create Model</span>
                            </a>
                        </li>

                        <li class="nav-item">
                            <a class="nav-link" href="/createL">
                                <span><FilePlus /> Import Model</span>

                            </a>
                        </li>
                    </ul>
                    {/*
                    <h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                        Graph edition
                    </h6>
                    <ul class="nav flex-column">
                        <li class="nav-item">
                            <a class="nav-link" href="/edit">
                                <span><Edit /></span>      Edit a projection
                            </a>
                        </li>
                    </ul>
                    */}


                </div>
            </nav>

        </div>

    }

}
export default withRouter(SidebarModel)

