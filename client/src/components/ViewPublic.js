import React from 'react';
import CardGroup from 'react-bootstrap/CardGroup';
import RoleDescription from './roleDescription';

import Header from './Header';
import ExecLogger from './execLogger';
import PublicMarkings from './PublicMarkings';
import { Card, Button, Row, Col, Form, Container } from 'react-bootstrap';
import Sidebar from './SidebarInstance';


import equal from 'fast-deep-equal'

import PublicDCRManager from '../contracts/PublicDCRManager.json';
import getWeb3 from '../getWeb3';

import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import COSEBilkent from 'cytoscape-cose-bilkent';
Cytoscape.use(COSEBilkent);

var node_style = require('../style/nodeStyle.json');
var edge_style = require('../style/edgeStyle.json');
var cyto_style = require('../style/cytoStyle.json')['dcr'];

var ProcessDB = require('../projections/DCR_Projections.json');

/**
 * Component displaying the public view (the 'blockchain view') of a process choreography.
 */
class ViewPublic extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      projType: 'Public Projection',

      processData: '',
      activityNames: [],
      execLogs: '',

      processID: 'p1',
      projectionID: 'Public',
      processData: '',
      processName: '',

      web3: null,
      accounts: null,
      contract: null,

      incl: [],
      exec: [],
      pend: [],
      dataHashes: [],
      lg_activityNames: []
    };

    this.loadContract = this.loadContract.bind(this);
  }

  /**
   * detects whether the view should be changed because of a sidebar trigger
   */
  shouldComponentUpdate(nextProps) {
    if (typeof (this.props.location.state) !== 'undefined') {
      return ((nextProps.location.state['currentProcess'][0] !== this.state.processID) || (nextProps.location.state['currentInstance'] !== this.state.projectionID));
    }
    else {
      return false;
    }
  }

  /**
   * if a view update occurs, updates all state variables (new processID, projectionID, execLogs, and activity names)
   */
  componentDidUpdate(prevProps) {
    // update processID
    if (!equal(this.props.location.state['currentProcess'][0], prevProps.location.state['currentProcess'][0]) ||
      !equal(this.props.location.state['currentInstance'], prevProps.location.state['currentInstance'])
    )// check props UPD
    {
      console.log('new view:' + this.props.location.state['currentProcess'][0] + this.props.location.state['currentInstance']);

      if (typeof (this.props.location.state['currentProcess'][0]) !== 'undefined') {

        var processID = this.props.location.state['currentProcess'][0];
        var projectionID = this.props.location.state['currentInstance'];
        var ProcessData = ProcessDB[processID];

        console.log(ProcessData[projectionID]);


        this.setState({
          'processData': ProcessData[projectionID]['data'],
          'execLogs': ProcessData[projectionID]['exec']['execLogs'],
          'processID': processID,
          'projectionID': projectionID,
          'processName': this.props.location.state['currentProcess'][1],
          'activityNames': ProcessData[projectionID]['vect']["activityNames"]
        });
      }
    }
  }

  /**
   * Sets the view data according to processID and projectionID.
   */
  componentWillMount() {

    var processID = this.state.processID;
    console.log(processID);
    if (typeof (this.props.location.state) !== 'undefined') {
      if (typeof (this.props.location.state['currentProcess'][0]) !== 'undefined') {
        processID = this.props.location.state['currentProcess'][0];
        this.setState({
          'processID': processID,
          'processName': this.props.location.state['currentProcess'][1]
        });
      }
    }
    var processID = this.props.location.state['currentProcess'][1];
    var ProcessDataPublic = ProcessDB[processID][this.state.projectionID];
    console.log(ProcessDataPublic);

    this.setState({
      'processData': ProcessDataPublic['data'],
      'execLogs': ProcessDataPublic['exec'],
      'activityNames': ProcessDataPublic['vect']["activityNames"]
    })

    this.loadContract();


  }

  /**
   * connects to web3.js and loads public markings associated to the process.
   */
  async loadContract() {

    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = PublicDCRManager.networks[networkId];
      const instance = new web3.eth.Contract(
        PublicDCRManager.abi,
        deployedNetwork && deployedNetwork.address,
      );

      console.log('connected to web3');
      console.log(instance);

      var wkID = this.props.processName.replace('p', '') - 1;
      const inclVector = await instance.methods.getIncluded(wkID).call();
      const execVector = await instance.methods.getExecuted(wkID).call();
      const pendVector = await instance.methods.getPending(wkID).call();
      const hashesVector = await instance.methods.getHashes(wkID).call();

      this.setState({
        web3, accounts, contract: instance,
      });

      this.setState({
        incl: inclVector,
        exec: execVector,
        pend: pendVector,
        dataHashes: hashesVector
      })
    } catch (error) {
      // Catch any errors for any of the above operations.
      //alert(
      //  `Failed to load web3, accounts, or contract. Check console for details.`,
      //);
      console.error(error);
    };

  }


  /**
   * sets the graph display to the user window dimensions.
   */
  componentDidMount = async () => {
    this.cy.fit();
    // this.cy.wheelSensitivity(0.4)
    console.log("lol");
    console.log(this.cy);
  };

  render() {
    const layout = cyto_style['layoutCose'];
    const style = cyto_style['style'];
    const stylesheet = node_style.concat(edge_style)

    return <div key={this.state.processID}>
      <Header />
      <Container fluid >
        <Row >
          <Col >

            <div class="bg-green pt-5 pb-3">

              <div class='container'>
                <h2>Process {this.state.processName}</h2>
                <h3>Public Projection</h3>
                <p>This view represents the public DCR projection of the input workflow. Its state is managed in the blockchain. Execution logs and the markings of the public graph are displayed in the panels below. </p>
                <p>To update the public DCR, navigate to the role projections.</p>
                <Card id="projType" style={{ height: '70%', 'marginTop': '3vh' }}>
                  <Card.Header as="p" style={{ color: 'white', 'backgroundColor': '#006588', 'borderBottom': 'white' }}>
                    {this.state.projType}</Card.Header>
                  <Card.Body>
                    <CytoscapeComponent elements={this.state.processData}
                      stylesheet={stylesheet}
                      layout={layout}
                      style={style}
                      cy={(cy) => {this.cy = cy}}
                      wheelSensitivity={0.3}
                      boxSelectionEnabled={false}
                    />
                  </Card.Body>
                </Card>

                <ExecLogger execLogs={this.state.execLogs} activityNames={this.state.activityNames} />

                <PublicMarkings
                  activityNames={this.state.activityNames['default']}
                  incl={this.state.incl}
                  pend={this.state.pend}
                  exec={this.state.exec}
                  dataHashes={this.state.dataHashes}
                  //dataValues={this.state.dataValues}
                  processID={this.state.processName}
                />

              </div>
            </div>
          </Col>
        </Row>
      </Container>

    </div>;
  }
}

export default ViewPublic
