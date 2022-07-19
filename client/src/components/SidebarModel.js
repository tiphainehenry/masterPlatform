import '../style/Dashboard.css'
import React from "react";
import { withRouter } from "react-router";

import '../style/boosted.min.css';
import Authentification from './Authentification';

import { Users, FilePlus, Edit, PlayCircle, Cpu } from 'react-feather';


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
            var button = <div>                  <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                Role management
            </h6>
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <a className="nav-link" href="/newrole">
                            <span> <Users /> Manage roles</span>
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="/newdevice">
                            <span> <Cpu /> Manage IoT device</span>
                        </a>
                    </li>
                </ul></div>
        }
        return <div>

            <Authentification status={this.getStatus} />

            <nav id="sidebarMenu" role="navigation" className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
                <div className="sidebar-sticky pt-3">

                    {button}

                    <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                        Template creation
                    </h6>

                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <a className="nav-link" href="/new">
                                <span><Edit /> Create template</span>
                            </a>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link" href="/new">
                                <span><FilePlus /> Import template</span>
                            </a>
                        </li>

                        <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                            Launch new instance
                        </h6>


                        <li className="nav-item">
                            <a className="nav-link" href="/createL">
                                <span><PlayCircle/> Instantiate model from file</span>
                            </a>
                        </li>

                        <li className="nav-item">
                            <a className="nav-link" href="/instantiateTemplate">
                                <span><PlayCircle /> Instantiate template</span>
                            </a>
                        </li>

                    </ul>
                    {/*
                    <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
                        Graph edition
                    </h6>
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <a className="nav-link" href="/edit">
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

