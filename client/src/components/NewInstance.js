import React from 'react';
import Header from './Header';
import { Row, Col, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios, { get } from 'axios';

import SidebarModel from './SidebarModel';


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
      valid:true
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
      this.setState({valid:false})
    else
      this.setState({valid:true})
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
        <Container fluid >
          <Row >
            <Col sm={2} style={{ 'padding-left': 0, 'padding-right': 0 }}>
              <SidebarModel />
            </Col>
            <Col style={{ 'padding-left': 0, 'padding-right': 0 }}>
              <div className='bg-green pt-5 pb-3'>
                <div className='container'>
                  <h2>Creation of a new Process model</h2>
                  <h5>Choose the name of your process</h5>
                  <br />
                  <input type="input" onChange={e => this.onChange(e)} placeholder={this.state.processName}></input>
                  { !this.state.valid ? <p style={{'padding':'10px','color':'red'}}>Name of template already taken</p> :null}
                  <br></br>
                  { this.state.valid ? <Link class="btn btn-primary my-2 my-sm-0" to={{
                    pathname: './creation',
                    state: {
                      currentProcess: this.state.processName,
                      currentInstance: 'r1'
                    }
                  }}>New process</Link> :
                  <Link class="btn btn-primary my-2 my-sm-0" >New process</Link>
                  }
                  <br />
                  <br />
                  <Card style={{ height: '90%', 'marginTop': '3vh' }}>
                    <Card.Header as="p" style={{ color: 'white', 'backgroundColor': '#a267c9', 'borderBottom': 'white' }}>
                      Select an already existing template</Card.Header>
                    <Card.Body >
                      <Row style={{ 'fontSize': '10pt', 'fontWeight': 1000 }} xs={1} md={3} >
                        <Col style={{ 'minWidth': '66%' }} sm>Name</Col>
                        <Col style={{ 'minWidth': '34%' }} sm>last update</Col>
                      </Row>
                      <hr style={{
                        width: '95%',
                        color: 'LightGrey',
                        backgroundColor: 'LightGrey',
                        height: .1,
                        borderColor: 'LightGrey'
                      }} />

                      {Array.from({ length: this.state.templates.length }, (x, i) =>
                        <div>
                          <Row key={i} style={{ 'fontSize': '10pt', 'fontWeight': 200 }} xs={1} md={3} >
                            <Col style={{ 'minWidth': '66%' }} sm>
                              <Link  to={{
                                pathname: './creation',
                                state: {
                                  currentProcess: this.state.templates[i],
                                  currentInstance: 'r1'
                                }
                              }}>{this.state.templates[i]} </Link>
                            </Col>
                            <Col style={{ 'minWidth': '34%' }} sm>("test")</Col>
                          </Row>
                          <hr style={{
                            width: '95%',
                            color: 'LightGrey',
                            backgroundColor: 'LightGrey',
                            height: .1,
                            borderColor: 'LightGrey'
                          }} />
                        </div>
                      )}

                    </Card.Body>
                  </Card>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  }
}

export default NewInstance
