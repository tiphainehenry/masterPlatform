import React from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import PublicDCRManager from "../contracts/PublicDCRManager.json";
import getWeb3 from "../getWeb3";

import { Button, Table } from 'react-bootstrap';

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

      addresses:[],
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
    this.getWKCreationReceipt = this.getWKCreationReceipt.bind(this);

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

    try{
      if (lenDataDB > 0) {

        // connect list of activities to corresponding role first, and then to the right role address
        var activities = ProcessDB[Object.keys(ProcessDB)[1]]['TextExtraction']['public']['privateEvents']
  
        
        var orderedPk = []
        var orderedNames= ProcessDB[Object.keys(ProcessDB)[1]]['Public']['vect']['activityNames']['default'];
        for (let i in orderedNames){
          console.log(orderedNames[i]);
          var matchingPk = ''
          Object.keys(activities).forEach(k => {
            if(activities[k].eventName === orderedNames[i]){
              //console.log("Match between " + orderedNames[i]+"and"+activities[k].eventName);
              matchingPk = activities[k].address;
            }
          });
          if(matchingPk !== ''){
            orderedPk.push(matchingPk);
          }
  
        }
        let approvalList = [...new Set(orderedPk)];
        this.setState({
          data: ProcessDB[Object.keys(ProcessDB)[1]]['Global']['data'],
          processName: Object.keys(ProcessDB)[1],
          lenDataDB: lenDataDB,
  
          activityNames: ProcessDB[Object.keys(ProcessDB)[1]]['Public']['vect']['activityNames']['default'],
          includedStates: ProcessDB[Object.keys(ProcessDB)[1]]['Public']['vect']['fullMarkings']['included'],
          executedStates: ProcessDB[Object.keys(ProcessDB)[1]]['Public']['vect']['fullMarkings']['executed'],
          pendingStates: ProcessDB[Object.keys(ProcessDB)[1]]['Public']['vect']['fullMarkings']['pending'],
          includesTo: ProcessDB[Object.keys(ProcessDB)[1]]['Public']['vect']['fullRelations']['include'],
          excludesTo: ProcessDB[Object.keys(ProcessDB)[1]]['Public']['vect']['fullRelations']['exclude'],
          responsesTo: ProcessDB[Object.keys(ProcessDB)[1]]['Public']['vect']['fullRelations']['response'],
          conditionsFrom: ProcessDB[Object.keys(ProcessDB)[1]]['Public']['vect']['fullRelations']['condition'],
          milestonesFrom: ProcessDB[Object.keys(ProcessDB)[1]]['Public']['vect']['fullRelations']['milestone'],
          addresses: orderedPk,
          approvalList: approvalList
        })
      }
  
    }
    catch{
      console.log('initialization of the db')
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

      // Checking if contract already populated
      this.setState({ wkState: '2./ Uploaded' })

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
   * Get workflow creation receipt.
   */

  getWKCreationReceipt = async () => {

    try {
      this.setState({ blockNumber: "waiting.." });
      this.setState({ gasUsed: "waiting..." });

      // get Transaction Receipt in console on click
      // See: https://web3js.readthedocs.io/en/1.0/web3-eth.html#gettransactionreceipt
      await this.state.web3.eth.getTransactionReceipt(this.state.transactionHash, (err, txReceipt) => {
        console.log(err, txReceipt);
        this.setState({ txReceipt });
        console.log('tx receip null');
      }); //await for getTransactionReceipt

      await this.setState({ blockNumber: this.state.txReceipt.blockNumber });
      await this.setState({ gasUsed: this.state.txReceipt.gasUsed });
    } //try
    catch (error) {
      console.log('getWKCreationReceipt error');

      console.log(error);
    } //catch
  } //getWKCreationReceipt



  /**
   * launches a transaction to the smart contract workflow manager to create a new workflow.
   */
  handleCreateWkf = async () => {
    alert('Save public view onchain');

    const { accounts, contract } = this.state;


    try {

      if(this.state.includedStates.length === 0){
        alert("oops -didnt have time to update freshly updated db [to be implemented]");  
      }
      else{
        var relations = [this.state.includesTo,
          this.state.excludesTo,
          this.state.responsesTo,
          this.state.conditionsFrom,
          this.state.milestonesFrom]
        console.log(relations);

        await contract.methods.uploadPublicView(
          [this.state.includedStates,this.state.executedStates,this.state.pendingStates], //marking
  
          this.props.ipfsHash,
          this.state.addresses,
          this.state.approvalList,
          this.state.activityNames,
          this.state.processName,
          relations 
        ).send({ from: accounts[0] });
          
      }

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

      this.setState({ wkState: '2/. Save public view onchain' });
    }


  }


  render() {
    const layout = cyto_style['layoutCose'];
    const style = cyto_style['style'];
    const stylesheet = node_style.concat(edge_style)
    if (window.location.href.indexOf("creation"))
      return (<div>
      <Button onClick= {this.handleCreateWkf}>{this.state.wkState}</Button>
     <br/>
     <br/>
                  <Button onClick={this.getWKCreationReceipt}> Get Transaction Receipt </Button>

                  <Table bordered responsive>
                    <thead>
                      <tr>
                        <th>Tx Receipt Category</th>
                        <th>Values</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td>IPFS Hash # stored on Eth Contract</td>
                        <td>{this.props.ipfsHash}</td>
                      </tr>
                      <tr>
                        <td>Ethereum Contract Address</td>
                        <td>{this.state.ethAddress}</td>
                      </tr>

                      <tr>
                        <td>Tx Hash # </td>
                        <td>{this.state.transactionHash}</td>
                      </tr>

                      <tr>
                        <td>Block Number # </td>
                        <td>{this.state.blockNumber}</td>
                      </tr>

                      <tr>
                        <td>Gas Used</td>
                        <td>{this.state.gasUsed}</td>
                      </tr>
                    </tbody>
                  </Table>


      </div>)
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
