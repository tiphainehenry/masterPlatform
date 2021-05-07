import React from 'react';
import Header from './Header';
import { Row, Col, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import SidebarModel from './SidebarModel';


var ProcessDB = require('../projections/DCR_Projections.json');

/**
 * Component displaying all possible projections to update
 */
class NewInstance extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
        numProcess:0
    };

  }

  /**
   * Lists all processes and their role projections, and stores it into the tree state variable
   */
  componentDidMount = async () => {
    
    this.setState({numProcess : 44})
  };

  onChange(e) {
      this.setState({processName: e})
  }

  render() {
    var tmp = "process p" + (Object.keys(ProcessDB).length + 2)
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
                        <h5>Step 1 - Choose the name of your process</h5>
                        <Link class="btn btn-primary my-2 my-sm-0" to={{
                                      pathname: './creation',
                                      state: {
                                        currentProcess: tmp.split(" "),
                                        currentInstance: 'r1'
                                      }
                                    }}>New process</Link>
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
