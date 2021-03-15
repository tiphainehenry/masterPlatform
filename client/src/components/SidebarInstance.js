import '../style/Dashboard.css'
import React from "react";
import { Nav } from "react-bootstrap";
import { withRouter } from "react-router";
import { Link } from 'react-router-dom';

import { Navbar, NavDropdown, Button, Row, Col } from 'react-bootstrap';
import { NavLink } from "react-router-dom"
import '../style/boosted.min.css';
import axios from 'axios';

import ListGroup from 'react-bootstrap/ListGroup';


var ProcessDB = require('../projections/DCR_Projections.json');

/**
 * Sidebar component to access role projection instance execution pannels.
 */
class Sidebar extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            global: 'Global DCR to project',
            public: 'Public Projection',
            roleLength: '',
            roles: [],
            tree: []
        };

        this.delete = this.delete.bind(this);
    }

    /**
     * Lists all processes and their role projections, and stores it into the tree state variable
     */
    componentDidMount() {

        var numProcess = Object.keys(ProcessDB).length;

        var tree = [];

        for (var j = 0; j <= numProcess; j++) {

            try {
                var dcrText = ProcessDB[Object.keys(ProcessDB)[j]]['TextExtraction']
                var name = ProcessDB[Object.keys(ProcessDB)[j]]['id']

                var roleLength = dcrText['roleMapping'].length;

                var i;
                var roles = [];
                for (i = 1; i <= roleLength; i++) {
                    var role = [];
                    var r = 'r' + i;
                    role.push(r);
                    role.push(dcrText[r]['role'])
                    roles.push(role)
                }
                this.setState({
                    roleLength: roleLength,
                    roles: roles
                });

                var process = [];
                process.push('process ' + name);
                process.push(roles);
                tree.push(process);

            }
            catch {
            }

        }

        this.setState({ 'tree': tree });

    }


    /**
     * Deletes a process instance via an API call to the delete route.
     * @param elem process id to delete
     */
    delete(elem) {

        var txt;
        var r = window.confirm("Proceed to deletion of instance " + elem + "?");
        if (r == true) {
            txt = "You pressed OK!";

            var headers = {
                "Access-Control-Allow-Origin": "*",
            };

            axios.post(`http://localhost:5000/delete`,
                {
                    processID: elem.split(' ')[1]
                },
                { "headers": headers }
            ).then(
                (response) => {
                    var result = response.data;
                    console.log(result);
                },
                (error) => {
                    console.log(error);
                }
            );


        } else {
            txt = "You pressed Cancel!";
        }
    }

    render() {

        return <div>

            <div class="sidebar">
                <Nav className="col-md-12 d-none d-md-block sidebar">
                    {this.state.tree.map((process, i) => {
                        return <Nav key={i} title={process[0]} class='sidebarLink'>
                            <ListGroup>
                                <ListGroup.Item class='processHeader'>
                                    {process[0]}
                                </ListGroup.Item>

                                <ListGroup.Item>

                                    {process[1].map(item =>
                                        <ul>
                                            <Nav.Item >
                                                <Nav.Link as={Link}
                                                    to={{
                                                        pathname: './tenantInstance',
                                                        state: {
                                                            currentProcess: process[0].split(' '),
                                                            currentInstance: item[0]
                                                        }
                                                    }}
                                                >
                                                    Proj {item[1]}
                                                </Nav.Link>
                                            </Nav.Item>
                                        </ul>

                                    )}
                                    <Nav.Item>
                                        <Nav.Link as={Link}
                                            to={{
                                                pathname: './publicInstance',
                                                state: {
                                                    currentProcess: process[0].split(' '),
                                                    currentInstance: 'Public'
                                                }
                                            }}
                                        >
                                            [BC] Public
                                 </Nav.Link>
                                    </Nav.Item>

                                    <hr />
                                    <Col><Link value={process[0]} to={'./welcomeinstance'} onClick={() => this.delete(process[0])}>delete instances</Link></Col>

                                </ListGroup.Item>
                            </ListGroup>

                            <hr />

                        </Nav>
                    }
                    )
                    }


                </Nav>
            </div>
        </div>

    }

}
export default withRouter(Sidebar)




