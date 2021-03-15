import React from 'react';
import Header from './Header';
import DCRgraph from './DCRgraph';
import { Card, Button, Row, Col, Form, Container } from 'react-bootstrap';
import Sidebar from './SidebarInstance';

import { Nav } from "react-bootstrap";
import { withRouter } from "react-router";
import { Link } from 'react-router-dom';

import { Navbar, NavDropdown } from 'react-bootstrap';
import { NavLink } from "react-router-dom"
import '../style/boosted.min.css';
import axios from 'axios';

import ListGroup from 'react-bootstrap/ListGroup';
import '../style/Dashboard.css'

var ProcessDB = require('../projections/DCR_Projections.json');

/**
 * Welcome component
 */
class WelcomeInstance extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

      roleLength: '',
      roles: [],
      tree: [],


      elemClicked: {
        id: '',
        activityName: '',
        classes: '',
        type: ''
      },

      numSelected: 0,

      tenantName: '',

      choreographyNames: {
        sender: '',
        receiver: '',
      },

      markings: {
        included: 0,
        executed: 0,
        pending: 0
      },

      newActivityCnt: 0,

      source: { ID: '', type: '' },
      target: { ID: '', type: '' }
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
      <Header />
      <Container fluid >
        <Row >
          <Col >
            <div class="bg-green pt-5 pb-3">

              <div class='container'>


                <div class="row align-items-center">

                  <div class="col-12 col-md-6 col-lg-4">
                    <h2>Instance Pannel</h2>
                    <p class="lead">
                      Welcome to the instance panel. Click on the sidebar or below to access running DCR projections. If none, first import a graph via the
        <a href='/welcomemodel'> My Process Models </a> dongle.
      </p>
                  </div>
                  <div class="col-12 col-md-6 col-lg-8">
                    <img src="Medium_cible_rvb.jpg" alt="" id='resize-verysmall' class="img-fluid" loading="lazy" />
                  </div>
                </div>


                <div className="well">Choose the process projection instance to manage:</div>

                <div class="bg-green">
                  <Nav >
                    {this.state.tree.map((process, i) => {
                      return <Nav key={i} title={process[0]} class='sidebarLink'>
                        <div style={{ 'padding-right': '10%', 'width': '20vw' }}>
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
                                        pathname: './tenantInstance/'+process[0].split(' ')[1]+'/'+item[0]
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
                        </div>

                      </Nav>
                    }
                    )
                    }


                  </Nav>

                </div>

              </div>
            </div>


          </Col>
        </Row>
      </Container>
    </div>;
  }
}

export default WelcomeInstance
