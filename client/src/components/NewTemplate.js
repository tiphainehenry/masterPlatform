import React from 'react';
import Header from './Header';
import { Row, Container, Table, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';

import SidebarModel from './SidebarModel';

import { FilePlus, File } from 'react-feather';

var ProcessDB = require('../projections/DCR_Projections.json');

/**
 * Component displaying all possible projections to update
 */
class NewTemplate extends React.Component {

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
    const name = "t" + (Object.keys(ProcessDB).length + 2)
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
                  <h1>Creation of a new template</h1>
                  <ul class="nav nav-tabs">
                  </ul>
                  <div class="tab-content" >
                    <div class="tab-pane active" id="users">

                      <form id="search-users" name="searchUsers" method="post" action="/">
                        <div class="row">
                          <div class="form-group col-12 ">
                            <label class="is-required" for="role">Choose the name of your process</label>
                            <input type="input" onChange={e => this.onChange(e)} placeholder={this.state.processName} class="form-control required"></input>
                            {!this.state.valid ? <p style={{ 'padding': '10px', 'color': 'red' }}>Name of template already taken</p> : null}
                          </div>
                          <div class="form-group col-12 ">

                            {this.state.valid ? 
                            
                            <Nav.Link as={Link}
                            to={{
                              pathname: './creation/' + this.state.processName
                            }}
                          >  create new model <FilePlus />
                          </Nav.Link>
                           :
                           <Nav.Link as={Link}
                           >  create new model <FilePlus />
                         </Nav.Link>
                         }
                          </div>

                        </div>
                      </form>
                    </div>
                  </div>

                  <br />
                  <br></br>

                  <br />
                  <br />

                  <Table id="myTable" class="table tablesorter table-responsive">
                    <caption>My templates </caption>
                    <thead class="cf">
                      <tr>
                        <th class="header" scope="col">Name (click to edit)</th>
                        <th class="header" scope="col">Type</th>
                        <th class="header" scope="col">Last Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: this.state.templates.length }, (x, i) =>

                        <tr>
                          <td class="align-middle">
                          <Nav.Link as={Link}
                                        to={{
                                          pathname: './creation/' + this.state.templates[i] 
                                        }}
                                      >  <File />{this.state.templates[i]}
                                      </Nav.Link>
                          </td>
                          <td class="align-middle">("test")</td>
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

export default NewTemplate
