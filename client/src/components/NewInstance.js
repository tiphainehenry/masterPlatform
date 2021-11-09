import React from 'react';
import Header from './Header';

import { Table, Row, Container, Nav} from 'react-bootstrap';

import { Link } from 'react-router-dom';
import axios from 'axios';

import SidebarModel from './SidebarModel';

import {File } from 'react-feather';

var ProcessDB = require('../projections/DCR_Projections.json');

/**
 * Component displaying all possible projections to update
 */
class NewInstance extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      numProcess: 0,
      processName: "",
      templates: [],
      valid: true
    };

  }

  /**
   * Lists all processes and their role projections, and stores it into the tree state variable
   */
  componentDidMount = async () => {
    this.getTemplates()
    const name = "p" + (Object.keys(ProcessDB).length + 2)
    this.setState({ numProcess: 44, processName: name })

  };

  onChange(e) {
    console.log(e.target.value)
    this.setState({ processName: e.target.value })
    if (this.state.templates.includes(e.target.value))
      this.setState({ valid: false })
    else
      this.setState({ valid: true })
  }

  /**
 * Get the list of saved templates names in DB
 * @returns 
 * 
 */
  getTemplates() {
    const config = {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    };
    axios.get(`http://localhost:5000/library?all=true`, config).then(
      (response) => {
        var result = response;
        this.setState({ templates: result.data })
      },
      (error) => {
        console.log(error);
      }
    );
  }

  render() {
    return <>
      <div>

        <Header />

        <Row>
          <SidebarModel />

          <div class="bg-green col-md-9 ml-sm-auto col-lg-10 px-md-4">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 ">

              <Container fluid >

                <div className='container'>
                  <h1>Instanciate a process model</h1>

                  <Table id="myTable" class="table tablesorter table-responsive">
                          <thead class="cf">
                            <tr>
                              <th class="header" scope="col">My templates (click to instanciate)</th>
                              <th class="header" scope="col">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: this.state.templates.length }, (x, i) =>

                              <tr>
                                <td class="align-middle">
                                  
                                  
                                <Nav.Link as={Link}
                                        to={{
                                          pathname: './loadInstance/' + this.state.templates[i] 
                                        }}
                                      >  <File />{this.state.templates[i]}
                                      </Nav.Link>

                                </td>
                                <td class="align-middle">("test")</td>
                              </tr>
                            )}


                          </tbody>
                        </Table>


                </div>

              </Container>
            </div>
          </div>
        </Row>
      </div>
    </>
  }
}

export default NewInstance
