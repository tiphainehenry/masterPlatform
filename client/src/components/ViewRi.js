import React from 'react';
import Header from './Header';
import DCRgraph from './DCRgraph';
import { Card, Button, Row, Col, Form, Container } from 'react-bootstrap';
import Sidebar from './SidebarInstance';
import { useLocation } from 'react-router-dom';

import equal from 'fast-deep-equal';
import { useParams } from "react-router";

var ProcessDB = require('../projections/DCR_Projections.json')

/**
 * Component displaying the role projection view of a process choreography -- calls DCRGraph, PublicMarkings, and ExecLogger
 */
class ViewRi extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      id: '',
      data: '',
      execLogs: '',
      processID: Object.keys(ProcessDB)[0],
      projectionID: 'r1',
      processName: 'demo',
      projectionsExist: true,
      pid: ''
    }

  };

  /**
   * detects whether the view should be changed because of a sidebar trigger
   */

  /**
   * if a view update occurs, updates all state variables (new processID, projectionID, execLogs, and activity names)
   */

  /**
   * Sets the view data according to processID and projectionID.
   */

  componentWillMount() {
    var processID = this.props.match.params.pid;
    var projectionID = this.props.match.params.rid;
    var ProcessData = ProcessDB[processID];

    this.setState({
      'processID': processID,
      'processName': processID,
      'projectionID': projectionID,
      'data': ProcessData[projectionID]['data'],
      'execLogs': ProcessData[projectionID]['exec'],
      'id': ProcessData['TextExtraction'][projectionID]['role'],
      'projectionsExist': true
    });
  }



  render() {
    return <div key={this.state.processID}>
      <Header />
      <Container fluid >
        <Row>
          <Col>
            {this.state.projectionsExist ?
              <DCRgraph
                id={this.state.id}
                data={this.state.data}
                execLogs={this.state.execLogs}
                processID={this.state.processID}
                processName={this.state.processName}
                projectionID={this.state.projectionID}
              /> :
              <div class="bg-green pt-5 pb-3">No projection yet, please go to the process models portal</div>
            }

          </Col>
        </Row>
      </Container>
    </div>;
  }
}

export default ViewRi
