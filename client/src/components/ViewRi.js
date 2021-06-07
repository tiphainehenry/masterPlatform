import React from 'react';
import Header from './Header';
import DCRgraphL from './DCRgraphL';
import DCRgraphG from './DCRgraphG';
import { Row, Col, Container } from 'react-bootstrap';

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
      'projectionsExist': true,
      'projType': ProcessData['projType'],
      'projectionHash':ProcessData['projHash']
    });
  }

  render() {

    return <div key={this.state.processID}>
      <Header />
      <Container fluid>
        <Row>
          <Col>
            {(this.state.projectionsExist && this.state.projType == 'p_to_g') ?
              <DCRgraphL
                id={this.state.id}
                data={this.state.data}
                execLogs={this.state.execLogs}
                processID={this.state.processID}
                processName={this.state.processName}
                projectionID={this.state.projectionID}
                projectionHash={this.state.projectionHash}
              /> : <div></div>
            }

            {(this.state.projectionsExist && this.state.projType == 'g_to_p') ?
              <DCRgraphG
                id={this.state.id}
                data={this.state.data}
                execLogs={this.state.execLogs}
                processID={this.state.processID}
                processName={this.state.processName}
                projectionID={this.state.projectionID}
                projectionHash={this.state.projectionHash}
              /> : <div></div>
            }

            {(!this.state.projectionsExist) ?

              <div className="bg-green pt-5 pb-3">No projection yet, please go to the process models portal</div>
              : <div></div>
            }


          </Col>
        </Row>
      </Container>
    </div>;
  }
}

export default ViewRi
