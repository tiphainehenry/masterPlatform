import React from 'react';

import Header from './Header';
import ExecLogger from './execLogger';
import PublicMarkings from './PublicMarkings';
import { Card, Row, Col, Container } from 'react-bootstrap';

import equal from 'fast-deep-equal'

import PublicDCRManager from '../contracts/PublicDCRManager.json';
import getWeb3 from '../getWeb3';

import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import COSEBilkent from 'cytoscape-cose-bilkent';
import panzoom from 'cytoscape-panzoom';

panzoom(Cytoscape);
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

      activityNames: [],
      execLogs: '',

      processID: 'p1',
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
   * Sets the view data according to processID and projectionID.
   */
  componentWillMount() {
    var processID = this.props.match.params.pid;
    var ProcessDataPublic = ProcessDB[processID]['Public'];
    alert(ProcessDataPublic);

    this.setState({
      'processID': processID,
      'data': ProcessDataPublic['data'],
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
    this.cy.panzoom()
    this.cy.nodes().forEach(node => {
      const classes = node._private.classes
      if (classes.has("choreography") || classes.has("external"))
        if (classes.has("executed"))
          node.addClass("choreoExecuted")
        else if (classes.has("pending"))
          node.addClass("choreoPending")
        else if (classes.has("executable"))
          node.addClass("choreoExecutable")
    })
  };

  render() {
    const layout = cyto_style['layoutCose'];
    const style = cyto_style['style'];
    const stylesheet = node_style.concat(edge_style)

    return <div key={this.state.processID}>
      <Header/>
      <Container fluid >
        <p>Hello {this.state.processID}</p>
        <Row>
          <Col>

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
