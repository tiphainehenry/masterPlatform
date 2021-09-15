import React from 'react';
import { Button, Card, Spinner } from 'react-bootstrap';

import { SolarSystemLoading} from 'react-loadingg';

import ipfs from '../ipfs';

import axios from 'axios';
import ExecLogger from './execLogger';
import PublicMarkings from './PublicMarkings';

import PublicDCRManager from '../contracts/PublicDCRManager.json';
import getWeb3 from '../getWeb3';

import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';


import Dagre from 'cytoscape-dagre'
import Klay from 'cytoscape-klay'
import COSEBilkent from 'cytoscape-cose-bilkent';

Cytoscape.use(COSEBilkent);
Cytoscape.use(Dagre)
Cytoscape.use(Klay)

var node_style = require('../style/nodeStyle.json');
var edge_style = require('../style/edgeStyle.json');
var cyto_style = require('../style/cytoStyle.json')['dcr'];

var ProcessDB = require('../projections/DCR_Projections.json');


/**
 * Responsive DCR graph display. Event execution requests are available > the public DCR smart contract is called if the node is public. 
 */
class DCRgraphL extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      start_timestamp: '',
      idClicked: '',
      indexClicked: '',
      nameClicked: '',

      processData: ProcessDB[this.props.processID],
      activityNames: ProcessDB[this.props.processID]['Public']['vect']["activityNames"],

      web3: null,
      accounts: null,
      contract: null,

      bcRes: '',
      owner: '',

      projType: '',

      addressProj: '',
      incl: '',
      exec: '',
      pend: '',
      dataHashes: '',
      activityData: '',
      wkID: '',
      pHash : ProcessDB[this.props.processName]['hash'] || '',
      dataValues: [],
      altVersionExists: false,
      file: null,
      processID: '',
      test: '',
      BCQuery: JSON.parse(localStorage.getItem('BCQuery')) || false,
      hasApproved: 0,

      hash: ''

    };
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.fileUpload = this.fileUpload.bind(this);
    this.fetchBCid = this.fetchBCid.bind(this);
    this.loadContract = this.loadContract.bind(this);
    this.handleProjSwitch = this.handleProjSwitch.bind(this);
    this.refreshBCQuery = this.refreshBCQuery.bind(this);
    this.reinitBCQuery = this.reinitBCQuery.bind(this);
    this.getIPFSOutput = this.getIPFSOutput.bind(this);
    this.generatePrivateView = this.generatePrivateView.bind(this);
  }

  /**
   * Checks if an alternative version exists to let the user decide if there is a need to switch to this version.
   * Loads the smart contract stored markings.
   */

  componentWillMount() {
    var dict = Object.keys(ProcessDB[this.props.processID][this.props.projectionID]);

    Object.entries(dict).forEach(([key, value]) => {
      //console.log(key, value);
      if (value === 'v_upd') {
        this.setState({
          altVersionExists: true
        });
      }
    });

    this.loadContract();
  }

  /**
   * Connects to DCR-manager smart contrat and calls the markings. 
   */
  async loadContract() {

    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      this.setState({ owner: accounts[0] });

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = PublicDCRManager.networks[networkId];
      const instance = new web3.eth.Contract(
        PublicDCRManager.abi,
        deployedNetwork && deployedNetwork.address,
      );

      var wkID = this.props.processName.replace('p', '') - 1;
      var pHash = ProcessDB[this.props.processName]['hash'];
      
      const inclVector = await instance.methods.getIncluded(pHash).call();
      const execVector = await instance.methods.getExecuted(pHash).call();
      const pendVector = await instance.methods.getPending(pHash).call();
      const hashesVector = await instance.methods.getHashes(pHash).call();

      var acc = web3.currentProvider.selectedAddress;
      const hasApproved = await instance.methods.hasApproved(pHash, acc).call();

      const approvalList = await instance.methods.getApprovalsOutcome(pHash).call();
      const approvalOutcome = approvalList.reduce((a, b) => parseInt(a) * parseInt(b), 1)

      const approvalAddresses = await instance.methods.getAddresses(pHash).call();

      this.setState({
        web3, accounts, contract: instance,
      });

      this.setState({
        incl: inclVector,
        exec: execVector,
        pend: pendVector,
        dataHashes: hashesVector,
        hasApproved: parseInt(hasApproved),
        approvalList: approvalList,
        approvalOutcome: approvalOutcome,
        approvalAddresses: approvalAddresses,
        wkID: wkID,
        pHash:pHash
      })
      this.cy.fit();

      instance.events.LogWorkflowProjection().on('data', (event) => {
        this.refreshBCQuery();
      })
        .on('error', console.error);

      //this.setState({hasCandidates:true,bestProfiles:[[1, 1445],[7, 1012],[4, 1012]]})  


    } catch (error) {
      // Catch any errors for any of the above operations.
      console.log(
        `[Load contract issue] Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    };

  }


  /**
   * Checks if an alternative version exists to let the user decide if there is a need to switch to this version.
   * Fits the graph display into the user window, and sets graph listeners. 
   */

  componentDidMount = async () => {

    var dict = Object.keys(ProcessDB[this.props.processID][this.props.projectionID]);

    Object.entries(dict).forEach(([key, value]) => {
      //console.log(key, value);
      if (value === 'v_upd') {
        this.setState({
          altVersionExists: true
        });
      }
    });

    var addresses = ProcessDB[this.props.processID]['TextExtraction']['public']['privateEvents'];
    var projType = ProcessDB[this.props.processID]['projType'];

    var addressProj = ''

    for (let id in addresses) {

      if (addresses[id]['role'] === this.props.id) {
        addressProj = addresses[id]['address'];
      }
    }

    this.setState({
      'addressProj': addressProj,
      'projType': projType
    });

    this.loadContract();
    this.cy.fit();
    this.setUpListeners();

    // this.props.data.unshift({group:"nodes",classes:"external choreography",data:{id:"c1s", name:"toto"}})
    //this.props.data.forEach(e => {
    //    console.log(e.data)
    //  })

  };

  refreshBCQuery = () => {

    this.setState({
      BCQuery: !this.state.BCQuery
    }, () => {
      localStorage.setItem('BCQuery', JSON.stringify(this.state.BCQuery))
    });
  }

  reinitBCQuery = () => {
    this.setState({
      BCQuery: false
    }, () => {
      localStorage.setItem('BCQuery', JSON.stringify(false))
    });

  }
  /**
   * Fetches the corresponding blockchain id of the clicked event before calling the SC.
   */
  fetchBCid() {

    // Step1: Fetch corresponding BC id.
    var lastChar = this.state.idClicked.charAt(this.state.idClicked.length - 1);

    var activities = []
    switch (lastChar) {
      case 's':
        activities = this.state.activityNames["send"];
        break; 

      case 'r':
        activities = this.state.activityNames["receive"];
        break;
      default:
        activities = this.state.activityNames["default"];
    }
    const isElem = (element) => element.includes(this.state.idClicked);
    const indexClicked = activities.findIndex(isElem);

    this.setState({ indexClicked: indexClicked });

  }

  /**
   * Calls the DCR-manager smart contract to check whether an event is executable. 
   * Catches the execution status, and updates all projections accordingly via a backend call.
   */
  runBCCheck = async () => {
    const { accounts, contract } = this.state;
    window.alert('Task  [' + this.state.nameClicked + '] is public... Proceeding to blockchain check');

    // fetch public workflow id
    this.fetchBCid();

    // execute transaction
    try {
      //var hashData = this.state.web3.utils.fromAscii(this.state.activityData);
      //await contract.methods.checkCliquedIndex(this.state.indexClicked, hashData).send({ from: accounts[0] });
      await contract.methods.checkCliquedIndex(this.state.pHash, this.state.indexClicked).send({ from: accounts[0] });

      // Get the value from the contract.
      const output = await contract.methods.getCanExecuteCheck(this.state.pHash, this.state.indexClicked).call();
      switch (output) {
        case '1':
          window.alert('Task not included');
          this.setState({ bcRes: 'BC exec - rejected - taskNotIncluded' });
          break;
        case '2':
          window.alert('Conditions not fulfilled');
          this.setState({ bcRes: 'BC exec - rejected - conditionsNotFulfilled' });
          break;
        case '3':
          window.alert('Milestones not fulfilled');
          this.setState({ bcRes: 'BC exec - rejected - milestonesNotFulfilled' });
          break;
        case '4':
          const rightAddress = await contract.methods.getRoleAddresses(this.state.pHash, this.state.indexClicked).call();
          window.alert('Authentication issue - wrong user tried to execute task.\nExpected ' + rightAddress + '...');
          this.setState({ bcRes: 'BC exec - rejected - authentication error' });
          break;
        case '0':
          //window.alert('Task executable');
          this.setState({ bcRes: 'executed' });
          break;
        default:
          this.setState({ bcRes: 'BC exec - rejected - Did not evaluate the task' });
      }

    }
    catch (err) {
      console.log("web3.eth.handleRevert =", this.state.web3.eth.handleRevert);
      const msg = 'BC exec - rejected - Metamask issue - Please try again (Higher gas fees, contract recompilation, or metamask reinstallation)';
      this.setState({ bcRes: msg });
    }

    // this.setState({ dataValues: this.state.dataValues.push(this.state.activityData) });
    axios.post(`http://localhost:5000/BCupdate`,
      {
        idClicked: this.state.idClicked,
        projId: this.props.id,
        execStatus: this.state.bcRes,
        activityName: this.state.nameClicked,
        start_timestamp: this.state.start_timestamp,
        data: this.state.activityData,
        processID: this.props.processID,
        proj_ID_num: this.props.id_num
      },
      { "headers": { "Access-Control-Allow-Origin": "*" } }
    );

  };



  /**
   * Listens to the graph for any node click. 
   * If a click occurs on a node, an API request is sent to the backend: if the event is private, its execution is directly processed. 
   * If it is public, the function runBCCheck is called.
   */
  setUpListeners = () => {

    this.cy.on('click', 'node', (event, data) => {
      var start_tmstp = new Date().toLocaleString();
      this.setState({
        start_timestamp: start_tmstp,
        nameClicked: event.target['_private']['data']['name'],
        idClicked: event.target['_private']['data']['id']
      });

      //var data = prompt('Please Enter Task Data');
      var dataMisc = 'Test';
      if (dataMisc === null) {
        console.log('canceled exec');
      }
      else {
        this.setState({ activityData: dataMisc });

        //updateGraphMarkings
        event.preventDefault();
        const idClicked = this.state.idClicked;
        var headers = {
          "Access-Control-Allow-Origin": "*",
        };
        axios.post(`http://localhost:5000/process`,
          {
            idClicked,
            projId: this.props.id,
            activityName: this.state.nameClicked,
            start_timestamp: this.state.start_timestamp,
            data: this.state.activityData,
            processID: this.props.processID
          },
          { "headers": headers }
        ).then(
          (response) => {
            var result = response.data;

            if (result.includes('BC')) {
              //check BC execution
              this.runBCCheck();
            }
          },
          (error) => {
            console.log(error);
          }
        );
      }

    })
  }

  /**
 * uploads file on user click.
 * @param e click event
 */
  onFormSubmit = async (e) => {
    const { accounts, contract } = this.state;

    try {
      e.preventDefault() // Stop form submit
      this.fileUpload(this.state.file).then((response) => {
        //console.log(response.data);
      })
    }
    catch (err) {
      console.log(err);
      this.reinitBCQuery();
    }

    try {
      alert('confirm projection');
      var acc = this.state.web3.currentProvider.selectedAddress;
      await contract.methods.confirmProjection(this.state.pHash, acc).send({ from: accounts[0] });
      this.refreshBCQuery();

    }
    catch (err) {
      localStorage.clear();
      this.reinitBCQuery();

    }

  }

  /**
   * updates filepath on new upload.
   * @param e upload event
   */
  onChange(e) {
    this.setState({ file: e.target.files[0] })
  }

  async getIPFSOutput(hash){
    return ipfs.cat(hash);
  }
  /**
   * upload filename and process it into the backend to generate projections.
   * @param file dcr textual representation (see examples in the DCRinput folder).
   */

  async generatePrivateView(formData){
    const url = `http://localhost:5000/localProj`;

    const config = {
      headers: {
        'content-type': 'multipart/form-data',
        //'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    };

    return axios.post(url, formData, config);

  } 


  async fileUpload(file) {

    alert('fetch public projection');
    var acc = this.state.web3.currentProvider.selectedAddress;
    await this.state.contract.methods.fetchPublicView(this.state.pHash, acc).send({ from: this.state.accounts[0] }); 
    
    await this.state.contract.methods.fetchPublicView(this.state.pHash, acc).call({ from: this.state.accounts[0] }).then((result) => {
      
      this.getIPFSOutput(result).then(output => {

        var JSONpubView = JSON.parse(output);
        console.log('retrieved data:', JSONpubView);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('processID', this.props.processName);
        formData.append('roleID', this.props.id);
        formData.append('roleNum', this.props.projectionID);

        formData.append('JSONPubView', JSON.stringify(JSONpubView));
        
        this.generatePrivateView(formData);
      })
     
      this.setState({ 
        ipfsHash: result,
        processID: this.props.processName
       });
    }
    );

  }

  /**
   * Updates private projection on demand --> checks if any ungoing pending activities exist. 
   * If no pending activities is spotted, then launch update via an API call.
   * Function accessible only if an alternative version has been generated on the process model pannel.
   */
  handleProjSwitch() {

    // Check if ungoing pending activities exist.
    var hasPending = false;
    this.cy.elements().forEach(function (ele) {
      if (ele['_private']['classes'].has('pending')) {
        hasPending = true;
      }
    });

    if (hasPending) {
      // If ongoing graph execution, revert. 
      console.log('not possible yet: we spotted a pending event --> the instance is under execution!');
    }
    else {
      // else, launch update: the current projection will be replaced by the alternative one via an API call.
      var headers = {
        "Access-Control-Allow-Origin": "*",
      };
      axios.post(`http://localhost:5000/switchProj`,
        {
          projID: this.props.id,
          processID: this.props.processID
        },
        { "headers": headers }
      ).then(
        (response) => {
          console.log('switched proj');
          this.setState({
            altVersionExists: false
          });
        },
        (error) => {
          console.log(error);
        }
      );
    }
  }

  render() {
    const layout = cyto_style['layoutCose'];
    const style = cyto_style['style'];
    const stylesheet = node_style.concat(edge_style);

    return <div>

      <div className="bg-green pt-5 pb-3">

        <div className='container'>
          <h2>Process {this.props.processName}</h2>
          <h3>Private Projection for the role {this.props.id}</h3>

          {this.state.web3 === null ? <div>Loading web3...</div> : <div style={((this.state.owner === this.state.addressProj) && (this.state.hasApproved === 0)) && (this.state.projType === 'p_to_g') ? {} : { display: 'none' }}>
            <form onSubmit={this.onFormSubmit}>
              <input type="file" onChange={this.onChange} />
              <Button className="btn btn-primary my-2 my-sm-0" type="submit">Upload and project my local projection</Button>
            </form>
            {this.state.BCQuery ? <Button variant="primary" disabled>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
              <span className="sr-only">Loading...</span>
            </Button>
              :
              <div></div>
            }

          </div>
          }

          <div style={((this.state.web3 !== null) && (this.state.owner !== this.state.addressProj)) ? {} : { display: 'none', 'marginTop': '3vh' }} >
            <h3 style={{ color: 'red' }}>Wrong address, connected with account {this.state.owner} instead of {this.state.addressProj}</h3>
          </div>

          <div style={((this.state.owner === this.state.addressProj) && (this.state.hasApproved === 1) && (this.state.approvalOutcome === 0)) ? {} : { display: 'none' }}>
            <p>Successful user projection. Waiting for other participants submissions.</p>
            <div style={{ 'marginTop': '60vh' }}>
              <SolarSystemLoading color={'#ff7900'} />
            </div>
          </div>

          <div style={(((this.state.web3 !== null) && (this.state.owner === this.state.addressProj)) && (((this.state.hasApproved === 1) && (this.state.approvalOutcome === 1)) || (this.state.projType === "g_to_p"))) ? {} : { display: 'none' }}>
            <div style={(this.state.owner === this.state.addressProj) ? {} : { display: 'none' }}>
              <div>
                <p>This view represents a private DCR projection of the input workflow. Its state is managed in a hybrid fashion.
                The local tasks are updated locally via API calls.
                  The public tasks are updated after a call to the smart contract instance of the public projection. </p>

                <p> Execution logs and the markings of the public graph are displayed in the panels below. </p>

                <p> Click on one of the nodes of the graph below to update the state of the workflow execution. NB. A task needs to be enabled (with a white background here) to be successful. Black tasks are external tasks, managed by another tenant.</p>

                <div className='bg-idheader'> My ETH address: {this.state.owner} </div>

                <Card style={{ height: '90%', 'marginTop': '3vh' }}>

                  <Card.Header as="p" style={{ color: 'white', 'backgroundColor': '#ff7900', 'borderBottom': 'white' }}>
                    {this.props.id} Projection - ETH address: {this.state.addressProj}

                  </Card.Header>
                  <Card.Body >
                    <CytoscapeComponent elements={this.props.data}
                      stylesheet={stylesheet}
                      layout={layout}
                      style={style}
                      cy={(cy) => { this.cy = cy }}
                      boxSelectionEnabled={true}
                    />
                  </Card.Body>
                </Card>
                <ExecLogger execLogs={this.props.execLogs} activityNames={this.state.activityNames} />
                <PublicMarkings
                  activityNames={this.state.activityNames["default"]}
                  incl={this.state.incl}
                  pend={this.state.pend}
                  exec={this.state.exec}
                  dataHashes={this.state.dataHashes}
                  dataValues={this.state.dataValues}
                  processID={this.props.processName}
                />

                {this.state.altVersionExists ?
                  <Button onClick={this.handleProjSwitch}>Switch to new version of the projection</Button> :
                  <></>
                }
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>;
  }
}

export default DCRgraphL
