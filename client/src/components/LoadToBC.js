import React from 'react';
import Button from 'react-bootstrap/Button';
import CytoscapeComponent from 'react-cytoscapejs';
import PublicDCRManager from "../contracts/PublicDCRManager.json";
import getWeb3 from "../getWeb3";

var node_style = require('../style/nodeStyle.json')
var edge_style = require('../style/edgeStyle.json')
var cyto_style = require('../style/cytoStyle.json')['dcr']


var ProcessDB = require('../projections/DCR_Projections.json');

/**
 * Component uploading a new public instance into the smart contract graph manager
 */
class LoadToBC extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: null,
      accounts: null,
      contract: null,
      data: '',
      lenDataDB: 0,
      wkState: '... waiting for Smart Contract instanciation ...',


      includedStates: '',
      executedStates: '',
      pendingStates: '',
      includesTo: '',
      excludesTo: '',
      responsesTo: '',
      conditionsFrom: '',
      milestonesFrom: ''
    };
    this.handleCreateWkf = this.handleCreateWkf.bind(this);
    this.connectToWeb3 = this.connectToWeb3.bind(this);
  }

  /**
   * checks whether any process instance has been uploaded.
   */
  componentDidMount() {
    this.setState({ lenDataDB: Object.keys(ProcessDB).length });
  }

  /**
   * uploads the public view stored locally after having generated the projection and connects to web3.
   */
  componentWillMount() {

    var lenDataDB = Object.keys(ProcessDB).length;
    if (lenDataDB > 0) {
      this.setState({
        data: ProcessDB[Object.keys(ProcessDB)[0]]['Global']['data'],
        processName: Object.keys(ProcessDB)[0],
        lenDataDB: lenDataDB,

        activityNames: ProcessDB[Object.keys(ProcessDB)[0]]['Public']['vect']['activityNames']['default'],
        includedStates: ProcessDB[Object.keys(ProcessDB)[0]]['Public']['vect']['fullMarkings']['included'],
        executedStates: ProcessDB[Object.keys(ProcessDB)[0]]['Public']['vect']['fullMarkings']['executed'],
        pendingStates: ProcessDB[Object.keys(ProcessDB)[0]]['Public']['vect']['fullMarkings']['pending'],
        includesTo: ProcessDB[Object.keys(ProcessDB)[0]]['Public']['vect']['fullRelations']['include'],
        excludesTo: ProcessDB[Object.keys(ProcessDB)[0]]['Public']['vect']['fullRelations']['exclude'],
        responsesTo: ProcessDB[Object.keys(ProcessDB)[0]]['Public']['vect']['fullRelations']['response'],
        conditionsFrom: ProcessDB[Object.keys(ProcessDB)[0]]['Public']['vect']['fullRelations']['condition'],
        milestonesFrom: ProcessDB[Object.keys(ProcessDB)[0]]['Public']['vect']['fullRelations']['milestone']

      })
    }

    this.connectToWeb3()

  }
  /**
   * connects to web3.js
   */
  async connectToWeb3() {

    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = PublicDCRManager.networks[networkId];
      const instance = new web3.eth.Contract(
        PublicDCRManager.abi,
        deployedNetwork && deployedNetwork.address,
      );

      this.setState({ web3, accounts, contract: instance });

      console.log('ok');

      // Checking if contract already populated
      const { contract } = this.state;
      this.setState({ wkState: 'Create Global Workflow OnChain.' })

    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. 
          Check console for details.
          Tip: Webpage should be connected to the Ropsten network via Metamask (https://metamask.io/).`,
      );
      console.error(error);
    };
  }

  /**
   * launches a transaction to the smart contract workflow manager to create a new workflow.
   */
  handleCreateWkf = async () => {
    alert('Creating Workflow onChain');

    const { accounts, contract } = this.state;

    try {

      await contract.methods.createWorkflow(
        this.state.includedStates,
        this.state.executedStates,
        this.state.pendingStates,

        this.state.activityNames,
        this.state.processName,

        this.state.includesTo,
        this.state.excludesTo,
        this.state.responsesTo,
        this.state.conditionsFrom,
        this.state.milestonesFrom
      ).send({ from: accounts[0] });

      //axios.post(`http://localhost:5000/reinit`, 
      //{
      //  processID:this.state.processName 
      //},
      //{"headers" : {"Access-Control-Allow-Origin": "*"}}
      //);
      // window.location.reload(false);

    }
    catch (err) {
      window.alert(err);
      this.setState({ wkState: 'Create Global Workflow OnChain' });
    }

  }


  render() {
    const layout = cyto_style['layoutCose'];
    const style = cyto_style['style'];
    const stylesheet = node_style.concat(edge_style)
    if (window.location.href.indexOf("creation"))
      return (null)
    return <div>
      {this.state.lenDataDB > 0 ?
        <CytoscapeComponent elements={this.state.data}
          stylesheet={stylesheet}
          layout={layout}
          style={style}
          cy={(cy) => { this.cy = cy }}
          boxSelectionEnabled={false}
        />
        :
        <></>
      }

    </div>;
  }
}

export default LoadToBC
