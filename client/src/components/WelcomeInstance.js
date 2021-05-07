import React from 'react';
import Header from './Header';
import { Button, Row, Col, Container } from 'react-bootstrap';

import { Nav } from "react-bootstrap";
import { Link } from 'react-router-dom';

import { Table } from 'react-bootstrap';
import '../style/boosted.min.css';
import axios from 'axios';

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

      numProcesses: 0,

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
        process.push(name);
        process.push(roles);
        tree.push(process);

      }
      catch {
      }

    }

    this.setState({ 'tree': tree, 'numProcesses': numProcess });

  }

  /**
   * Deletes a process instance via an API call to the delete route.
   * @param elem process id to delete
   */
  delete(elem) {

    var r = window.confirm("Proceed to deletion of instance " + elem + "?");
    if (r === true) {
      console.log("You pressed OK!");

      var headers = {
        "Access-Control-Allow-Origin": "*",
      };

      axios.post(`http://localhost:5000/delete`,
        {
          processID: elem
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
      console.log("You pressed Cancel!");
    }
  }

  deleteAll(event) {
    var r = window.confirm("Proceed to deletion of all instances?");
    if (r === true) {
      console.log("You pressed OK!");

      var headers = {
        "Access-Control-Allow-Origin": "*",
      };

      axios.post(`http://localhost:5000/deleteAll`,
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
      console.log("You pressed Cancel!");
    }

  }


  render() {
    return <div>
      <Header />
      <Container fluid >
        <Row >
          <Col >
            <div className="bg-green pt-5 pb-3">

              <div className='container'>


                <div className="row align-items-center">

                  <div className="col-6 col-md-6 col-lg-4">
                    <h2>Instance Pannel</h2>
                    <p className="lead">
                      Welcome to the instance panel. Click below to access running DCR projections. If none, first import a graph via the
        <a href='/welcomemodel'> My Process Models </a> dongle.
      </p>
                  </div>
                  <div className="col-6 col-md-6 col-lg-8">
                    <img src="Medium_cible_rvb.jpg" alt="" id='resize-verysmall' className="img-fluid" loading="lazy" />
                  </div>
                </div>

                <div className="well">Choose the process projection instance to manage:</div>

                <div className="bg-green">
                  <Nav>

                    <Table >

                      <tbody>
                        {this.state.tree.map((process, i) => {
                          return <Nav key={i} title={process[0]} >
                            <tr>
                              <td className="align-middle">{process[0]}</td>
                              
                                {process[1].map((item,i) =>
                                  <td key={i} className="align-middle" >
                                    <Nav.Link as={Link}
                                      to={{
                                        pathname: './tenantInstance/' + process[0] + '/' + item[0]
                                      }}
                                    >
                                      {item[1]} Projection
                                      </Nav.Link>
                                  </td>

                                )}
                              
                              <td className="align-middle">
                                <Nav.Link as={Link}
                                  to={{
                                    pathname: './publicInstance',
                                    state: {
                                      currentProcess: process[0].split(' '),
                                      currentInstance: 'Public'
                                    }
                                  }}
                                >
                                  Public Projection [BC]
                                 </Nav.Link>
                              </td>
                              <td className="align-middle">
                                <Link type="button" className="btn btn-sm btn-danger" value={process[0]} to={'./welcomeinstance'} onClick={() => this.delete(process[0])}>Delete</Link>
                              </td>

                            </tr>

                          </Nav>
                        }
                        )
                        }
                      </tbody>

                    </Table>
                  </Nav>





                </div>
                <br />


                {this.state.numProcesses === 0 ? <div></div> :
                  <div className="well">
                    <Button variant="danger" onClick={() => this.deleteAll()}>[DANGER] Delete all instances</Button>
                  </div>
                }

              </div>
            </div>

          </Col>
        </Row>
      </Container>
    </div>;
  }
}

export default WelcomeInstance
