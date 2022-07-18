import React from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button'

import axios from 'axios';
import ExecLogger from './execLogger';
import VarLogger from './varLogger';
import PublicMarkings from './PublicMarkings';

import PublicDCRManager from '../contracts/PublicDCRManager.json';
import AdminRoleManager from '../contracts/AdminRoleManager.json';
import AccessMatrix from '../contracts/Access_matrix.json';


import getWeb3 from '../getWeb3';
import ipfs from '../ipfs';

import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';

import Dagre from 'cytoscape-dagre'
import Klay from 'cytoscape-klay'
import COSEBilkent from 'cytoscape-cose-bilkent';

import { Spinner } from 'react-bootstrap';

import { SolarSystemLoading } from 'react-loadingg';


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
class DCRgraphG extends React.Component {
  constructor(props) {
    super(props);
    console.log(ProcessDB[this.props.processID]);

    this.state = {
      start_timestamp: '',
      idClicked: '',
      indexClicked: '',
      nameClicked: '',

      processData: ProcessDB[this.props.processID],
      activityNames: ProcessDB[this.props.processID]['Public']['vect']["activityNames"],
      vars: ProcessDB[this.props.processID]['variables'],
      varContractAddress: '',
      varValue: [],
      activitiesName: [],
      selectValue: "",
      InputValues: [],

      web3: null,
      accounts: null,
      contract: null,

      bcRes: '',
      owner: '',


      incl: '',
      exec: '',
      pend: '',

      pHash: ProcessDB[this.props.processName]['hash'] || '',

      dataHashes: '',
      activityData: '',
      wkID: '',
      dataValues: [],
      altVersionExists: false,
      chgType: 'NA',
      selectedNodeHTML: <p></p>,

      BCQuery: JSON.parse(localStorage.getItem('BCQuery')) || false,
      hasApprovedChg: 0,
      chgAprovalOutcomes: '',
      iamTheInitiator: '',
      markingStates: JSON.parse(localStorage.getItem('markingStates')) || [],
      relations: JSON.parse(localStorage.getItem('relations')) || [],
      addresses: JSON.parse(localStorage.getItem('addresses')) || [],

    };

    this.fetchBCid = this.fetchBCid.bind(this);
    this.loadContract = this.loadContract.bind(this);
    this.handleProjSwitch = this.handleProjSwitch.bind(this);
    this.reqHashUpload = this.reqHashUpload.bind(this);
    this.generateLocalChg = this.generateLocalChg.bind(this);
    this.finalSwitchProj = this.finalSwitchProj.bind(this);
    this.handleUpdWkf = this.handleUpdWkf.bind(this);
    this.uploadOnChain = this.uploadOnChain.bind(this);
    this.updMyHash = this.updMyHash.bind(this);
    this.updateVariable = this.updateVariable.bind(this);
    this.change = this.change.bind(this);
    this.getCanExecuteCheck = this.getCanExecuteCheck.bind(this);
    this.changeInput = this.changeInput.bind(this);

  }

  /**
   * Checks if an alternative version exists to let the user decide if there is a need to switch to this version.
   * Loads the smart contract stored markings.
   */

  componentWillMount() {
    var dict = Object.keys(ProcessDB[this.props.processID][this.props.projectionID]);

    var alt_v = false;
    Object.entries(dict).forEach(([key, value]) => {
      //console.log(key, value);
      if (value === 'v_upd') {
        alt_v = true
        this.setState({
          chgType: 'Private'
        });
      }

      this.setState({
        altVersionExists: alt_v,
      });

    });


    var projType = ProcessDB[this.props.processID]['projType'];

    this.setState({
      'projType': projType
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
      var pHash = ProcessDB[this.props.processName]['hash'];

      const inclVector = await instance.methods.getIncluded(pHash).call();
      const execVector = await instance.methods.getExecuted(pHash).call();
      const pendVector = await instance.methods.getPending(pHash).call();
      const hashesVector = await instance.methods.getHashes(pHash).call();
      const varAddress = await instance.methods.getVariableAddress(pHash).call();
      this.setState({ varContractAddress: varAddress })

      const MatrixInstance = new web3.eth.Contract(
        AccessMatrix.abi,
        varAddress
      );



      // try {
      // const A = "ActivityA";
      // const checkAccess = await MatrixInstance.methods.getAccess("ActiviteA",accounts[0]).call();

      // console.log("acces de l'utilisateur ", checkAccess);
      // } catch(error) {
      //   console.log(error);
      // }

      const allvars = await MatrixInstance.methods.getAllVariables(pHash).call();
      console.log("allvars = ", allvars);
      const actvts = await MatrixInstance.methods.getActivites(pHash, 0).call();
      console.log(actvts);

      // const currentValue = await MatrixInstance.methods.getVariableValue(pHash).call();
      // const varname = await MatrixInstance.methods.getVariableName(pHash).call();
      for(let k = 0; k < allvars[0].length; k++) {
        console.log([allvars[0][k]], allvars[1][k]);
        this.setState({ [allvars[0][k]] : allvars[1][k]});
        // console.log(this.state);
      }
      this.setState({ varValue: allvars[0], varName: allvars[1], activitiesName: actvts });
      // console.log(currentValue);

      const AdminDeployedNetwork = AdminRoleManager.networks[networkId];
      const AdminInstance = new web3.eth.Contract(
        AdminRoleManager.abi,
        AdminDeployedNetwork && AdminDeployedNetwork.address,
      );
      var userRoles = await AdminInstance.methods.getElemRoles(accounts[0]).call();
      var isRoleOwner = false;
      if (userRoles.includes(this.props.id)) {
        console.log('success, user is role owner')
        isRoleOwner = true;
      }

      var acc = web3.currentProvider.selectedAddress;
      const hasApprovedChg = await instance.methods.hasApprovedProjection(pHash, acc).call();

      const chgApprovalList = await instance.methods.getChangeApprovalsOutcome(pHash).call();
      //console.log('chg',chgApprovalList);
      const chgApprovalAddresses = await instance.methods.getEndorserAddresses(pHash).call();
      // const Test = await instance.methods.getTest().call(); //?

      await instance.methods.getChangeArgs(pHash).call()
        .then(res => {
          if (res._Test === 'approved by all endorsers') {

            const chgApprovalOutcome = chgApprovalList.reduce((a, b) => parseInt(a) + parseInt(b), 0);

            const outcome = chgApprovalOutcome / parseInt(res.numEndorsers);

            //console.log('chgStatus',res.ChangeValue);
            //console.log('iaminiti',res.initiator);
            var iamInit = (res.initiator === this.state.owner);
            this.setState({
              altVersionExists: true,
              chgType: 'public',
              reqHash: res.reqHash,
              chgApprovalOutcome: parseInt(outcome),
              chgStatus: parseInt(res.ChangeValue),
              iamTheInitiator: iamInit
            });
          }
        });

      this.setState({
        web3, accounts, contract: instance,
      });

      this.setState({
        incl: inclVector,
        exec: execVector,
        pend: pendVector,
        dataHashes: hashesVector,
        isRoleOwner: isRoleOwner,

        hasApprovedChg: parseInt(hasApprovedChg),
        chgApprovalList: chgApprovalList,
        chgApprovalAddresses: chgApprovalAddresses,
        testBis: 'init',
        test: 'init'

      })


      instance.getPastEvents('LogExecution', {
        //  filter: { endorser: accounts[0] }, // Using an array means OR: e.g. 20 or 23
        fromBlock: 0,
        toBlock: 'latest'
      })
        .then(function (events) {
          console.log(events); // same results as the optional callback above        
        });

      //console.log(chgApprovalAddresses);
      this.cy.fit();

    } catch (error) {
      // Catch any errors for any of the above operations.
      // alert(
      //   `[Load contract issue] Failed to load web3, accounts, or contract. Check console for details.`,
      // );
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
        //alert('its true');
        this.setState({
          altVersionExists: true
        });
      }
    });

    // this.props.data.unshift({group:"nodes",classes:"external choreography",data:{id:"c1s", name:"toto"}})
    //this.props.data.forEach(e => {
    //    console.log(e.data)
    //  })

    this.cy.fit();


    this.setUpListeners();
  };


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

    //console.log(indexClicked);

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

    //console.log('phash',this.state.pHash);
    //console.log('clicked index',this.state.indexClicked);
    //console.log('myAcc',accounts[0]);
    // execute transaction
    try {
      //var hashData = this.state.web3.utils.fromAscii(this.state.activityData);
      //await contract.methods.checkCliquedIndex(this.state.indexClicked, hashData).send({ from: accounts[0] });
      await contract.methods.checkCliquedIndex(this.state.pHash, this.state.indexClicked).send({ from: accounts[0] }).then(res => {
        this.getCanExecuteCheck();
      })

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


  async getCanExecuteCheck() {
    const { contract } = this.state;

    //   Get the value from the contract.
    await contract.methods.getCanExecuteCheck(this.state.pHash).call().then(output => {
      //console.log(output);
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
          //const rightAddress = await contract.methods.getRoleAddresses(this.state.pHash, this.state.indexClicked).call();
          window.alert('Authentication issue - wrong user tried to execute task.'); //\nExpected '+rightAddress+'...'
          this.setState({ bcRes: 'BC exec - rejected - authentication error' });
          break;
        case '0':
          //window.alert('Task executable');
          this.setState({ bcRes: 'executed' });
          break;
        default:
          this.setState({ bcRes: 'BC exec - rejected - Did not evaluate the task' });
      }

    });
  }
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
        console.log(ProcessDB[this.props.processID]);
        this.setState({
          selectedNodeHTML:
            <div className="card-text" >
              <div style={{ paddingTop: "1em" }}>

                <h3>{event.target['_private']['data']['name']}</h3>
                <p>Current Value : {this.state.varValue} </p>
                <input type="number" ></input>
                <button>Update Value</button>
              </div>
            </div>
        })

        //updateGraphMarkings
        event.preventDefault();
        const idClicked = this.state.idClicked;

        console.log(this.state.nameClicked);
        console.log(idClicked)
        var headers = {
          "Access-Control-Allow-Origin": "*",
        };
        // axios.post(`http://localhost:5000/process`,
        //   {
        //     idClicked,
        //     projId: this.props.id,
        //     activityName: this.state.nameClicked,
        //     start_timestamp: this.state.start_timestamp,
        //     data: this.state.activityData,
        //     processID: this.props.processID
        //   },
        //   { "headers": headers }
        // ).then(
        //   (response) => {
        //     var result = response.data;

        //     if (result.includes('BC')) {
        //       //check BC execution
        //       this.runBCCheck();
        //     }
        //   },
        //   (error) => {
        //     console.log(error);
        //   }
        // );
      }

    })
  }

  async reqHashUpload() {

    //alert('fetch reqHash public projection');

    this.getIPFSOutput(this.state.reqHash).then(output => {

      // step1: get req data
      var JSONpubView = JSON.parse(output);

      // step2: get local data
      var privateNodes = [];
      var edges = [];
      this.cy.nodes().forEach(function (ele) {

        if (!ele['_private']['classes'].has('type_choreography') &&
          !ele['_private']['classes'].has('type_projChoreo') &&
          !ele['_private']['classes'].has('choreography') &&
          !ele['_private']['data']['name'].includes('!') &&
          !ele['_private']['data']['name'].includes('?')
        ) {
          privateNodes.push({
            'data': ele['_private']['data'],
            'group': ele['_private']['group'],
            'classes': ele['_private']['classes'],
          });
        }
      });

      this.cy.edges().forEach(function (ele) {
        edges.push({
          'data': ele['_private']['data'],
          'group': ele['_private']['group'],
          'classes': ele['_private']['classes']
        })
      });

      // step3: merge projections (reqHash+ localProj)
      const formData = new FormData();
      formData.append('processID', this.props.processName);
      formData.append('roleID', this.props.id);
      formData.append('roleNum', this.props.projectionID);
      formData.append('JSONPubView', JSON.stringify(JSONpubView));
      formData.append('JSONPriView', JSON.stringify(privateNodes));
      formData.append('JSONedges', JSON.stringify(edges));
      this.generateLocalChg(formData);
      // step4: notify SC that local proj has been done. 

    })

  }

  async getIPFSOutput(hash) {
    return ipfs.cat(hash);
  }

  async generateLocalChg(formData) {
    const url = `http://localhost:5000/localChg`;

    const config = {
      headers: {
        'content-type': 'multipart/form-data',
        //'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    };

    return axios.post(url, formData, config);
  }

  async generatePublicChg(formData) {
    const url = `http://localhost:5000/publicChg`;
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
        'Access-Control-Allow-Origin': '*',
      }
    };
    return axios.post(url, formData, config);
  }

  fetchWKData(pid) {

    //Object.keys(ProcessDB).forEach(k => {console.log(k)});

    var activities = ProcessDB[pid]['TextExtraction']['public']['privateEvents'];


    var orderedPk = []
    var orderedNames = ProcessDB[pid]['Public']['vect']['activityNames']['default'];

    for (let i in orderedNames) {
      let matchingPk = ''
      Object.keys(activities).forEach(k => {
        if (activities[k].eventName === orderedNames[i]) {
          //console.log("Match between " + orderedNames[i]+"and"+activities[k].eventName);
          matchingPk = activities[k].address;
        }
      });
      if (matchingPk !== '') {
        orderedPk.push(matchingPk);
      }
    }
    let approvalList = [...new Set(orderedPk)];
    //console.log(ProcessDB[pid]['Public']['vect']['fullMarkings']['included'].length);

    var PubVec = ProcessDB[pid]['Public']['vect'];
    return [ProcessDB[pid]['Global']['data'],
      pid,
    PubVec['activityNames']['default'],
    PubVec['fullMarkings']['included'],
    PubVec['fullMarkings']['executed'],
    PubVec['fullMarkings']['pending'],
    PubVec['fullRelations']['include'],
    PubVec['fullRelations']['exclude'],
    PubVec['fullRelations']['response'],
    PubVec['fullRelations']['condition'],
    PubVec['fullRelations']['milestone'],
      orderedPk,
      approvalList
    ]


  }



  /**
 * launches a transaction to the smart contract workflow manager to update a workflow.
 */
  handleUpdWkf = async () => {
    //alert('Update public view onchain');

    // const { accounts, contract } = this.state;

    try {
      // connect list of activities to corresponding role first, and then to the right role address

      var wkData = this.fetchWKData(this.props.processID);

      var addresses = wkData[11];
      var _markingStates = [wkData[3], wkData[4], wkData[5]];
      var _relations = [wkData[6],
      wkData[7],
      wkData[8],
      wkData[9],
      wkData[10]];
      //console.log('_relations');
      //console.log(_relations);
      //console.log('_markingStates');
      //console.log(_markingStates);
      console.log('addresses');
      console.log(addresses);

      this.setState({
        markingStates: _markingStates
      }, () => {
        localStorage.setItem('markingStates', JSON.stringify(this.state.markingStates))
      });
      this.setState({
        relations: _relations
      }, () => {
        localStorage.setItem('relations', JSON.stringify(this.state.relations))
      });
      this.setState({
        addresses: addresses
      }, () => {
        localStorage.setItem('addresses', JSON.stringify(this.state.addresses))
      });

      this.setState({
        data: wkData[0],
        processName: wkData[1],

        activityNames: wkData[2],
        includedStates: wkData[3],
        executedStates: wkData[4],
        pendingStates: wkData[5],
        includesTo: wkData[6],
        excludesTo: wkData[7],
        responsesTo: wkData[8],
        conditionsFrom: wkData[9],
        milestonesFrom: wkData[10],
        approvalList: wkData[12],
        pHash: this.state.reqHash,
        altVersionExists: false
      });

    }
    catch (error) {
      console.log(error);
    }
  }



  async finalSwitchProj() {

    this.getIPFSOutput(this.state.reqHash).then(output => {

      // step1: get req data
      var JSONpubView = JSON.parse(output);

      // step2: bitvectorize
      const formData = new FormData();
      formData.append('processID', this.props.processName);
      formData.append('roleID', this.props.id);
      formData.append('JSONPubView', JSON.stringify(JSONpubView));
      formData.append('reqHash', this.state.reqHash);
      this.generatePublicChg(formData).then(res => {
        this.handleUpdWkf();//FETCH MARKINGS, RELS, ACTIVITYNAMES
      });
    })
  }

  /**
   * Updates projection on demand --> checks if any ungoing pending activities exist. 
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
      alert('[INFO] switch not possible yet (we spotted a pending event)');
    }
    else {
      if (this.state.chgType === 'Private') {
        alert('Launching ' + this.state.chgType + ' change');

        // else, launch update: the current projection will be replaced by the alternative one via an API call.
        // var headers = {
        //   "Access-Control-Allow-Origin": "*",
        // };
        alert('reqHash: ' + this.state.reqHash);
        axios.post(`http://localhost:5000/switchProj`,
          {
            projID: this.props.id,
            processID: this.props.processID,
            reqHash: this.state.pHash
            //reqHash: this.state.reqHash
          },
          { "headers": { "Access-Control-Allow-Origin": "*" } }
        ).then(
          (response) => {
            this.setState({
              altVersionExists: false
            });

          },
          (error) => {
            console.log(error);
          }
        );
      }
      else {

        console.log('change is public');

        this.callSwitchProj().then(res => {
          this.reqHashUpload();

        });
      }
    }
  }

  async callSwitchProj() {
    const { contract } = this.state;

    await contract.methods.confirmChangeProjection(this.state.pHash, this.state.accounts[0])
      .send({ from: this.state.accounts[0] })
      .then(res => {
        console.log(res);
      });
  }

  async uploadOnChain() {
    const { contract } = this.state;

    var wkData = this.fetchWKData(this.props.processID);
    var addresses = wkData[11];

    console.log(this.state.activityNames['default']);
    console.log(addresses);

    await contract.methods.switchWorkflows(
      this.state.pHash,
      this.state.markingStates,
      this.state.relations,
      this.state.activityNames['default'],
      addresses
    )
      .send({ from: this.state.accounts[0] })
      .then(res => {
        this.updMyHash();
      });
  }

  async updateVariable(event, idex) {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      this.setState({ owner: accounts[0] });
      const MatrixInstance = new web3.eth.Contract(
        AccessMatrix.abi,
        this.state.varContractAddress
      );
      var pHash = ProcessDB[this.props.processName]['hash'];
      const allvars = await MatrixInstance.methods.updateValue(pHash, idex, event, this.state.selectValue).send({from : accounts[0]});

    }
    catch (e) {
      console.log(e);
    }
  }

  change(event) {
    console.log(event.target.value);
    try {
      this.setState({ selectValue: event.target.value });
    }
    catch (e) {
      console.log(e);
    }
  }

  changeInput(event) {
    if(event)
    try {
      console.log(event.target.value);
      this.setState({ [event.target.id] : event.target.value});
    }
    catch (e) {
      console.log(e);
    }
  }

  async updMyHash() {

    const formData = new FormData();
    formData.append('processID', this.props.processName);
    formData.append('roleID', this.props.id);
    formData.append('reqHash', this.state.reqHash);

    var headers = {
      "Access-Control-Allow-Origin": "*",
    };

    axios.post(`http://localhost:5000/updMyHash`,
      formData,
      { "headers": headers }
    ).then(
      (response) => {
        //console.log('switched proj');
      },
      (error) => {
        console.log(error);
      }
    );

  }



  onFormSubmit = async (e) => {
    const { accounts, contract } = this.state;

    try {
      e.preventDefault() // Stop form submit
      this.fileUpload(this.state.file);
    }
    catch (err) {
      console.log(err);
      this.reinitBCQuery();
    }

    try {
      alert('confirm projection');
      var acc = this.state.web3.currentProvider.selectedAddress;
      await contract.methods.confirmProjection(this.state.pHash, acc)
        .send({ from: accounts[0] });
      this.refreshBCQuery();

    }
    catch (err) {
      localStorage.clear();
      this.reinitBCQuery();

    }

  }


  render() {
    const layout = cyto_style['layoutCose'];
    const style = cyto_style['style'];
    const stylesheet = node_style.concat(edge_style);

    return <div>
      <div className="bg-green pt-5 pb-3">



        <div className='container'>


          <div style={((this.state.web3 !== null) && !this.state.isRoleOwner) ? {} : { display: 'none', 'marginTop': '3vh' }} >
            <h3 style={{ color: 'red' }}>Wrong address, connected with account {this.state.owner} instead of {this.props.id}'s one.</h3>
          </div>


          <div style={(this.state.isRoleOwner &&
            (Number.isNaN(this.state.chgApprovalOutcome) || (!this.state.altVersionExists ||
              ((this.state.chgApprovalOutcome === 1) && (this.state.chgStatus === 4))))) ? {} :
            { display: 'none' }}>
            <h2>Process {this.props.processName}</h2>
            <h3>Private Projection for the role {this.props.id}</h3>

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

            <p>This view represents a private DCR projection of the input workflow. Its state is managed in a hybrid fashion.
              The local tasks are updated locally via API calls.
              The public tasks are updated after a call to the smart contract instance of the public projection. </p>

            <p> Execution logs and the markings of the public graph are displayed in the panels below. </p>

            <p> Click on one of the nodes of the graph below to update the state of the workflow execution. NB. A task needs to be enabled (with a white background here) to be successful. Black tasks are external tasks, managed by another tenant.</p>

            <Card style={{ height: '90%', 'marginTop': '3vh' }}>
              <Card.Header style={{ color: 'white', 'backgroundColor': '#ff7900', 'borderBottom': 'white' }}>
                {this.props.id} Projection
                <div className='bg-idheader'> My ETH address: {this.state.owner} </div>
                <div className='bg-idheader'>Public view IPFS hash: {this.state.pHash}</div>
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
            <Card id="exec" style={{ height: '70%', 'marginTop': '3vh' }}>
              <Card.Header as="p" style={{ color: 'white', 'backgroundColor': 'blue', 'borderBottom': 'white' }}>
                Variable modifier</Card.Header>
              <Card.Body style={{ 'overflowY': 'scroll', height: '20vh' }}>
                Activity :
                <select onChange={this.change}>
                  {this.state.activitiesName.map((value, index) => {
                    return <option value={value}>{value}</option>
                  })}
                </select>
                {this.state.varValue.map((value, index) => {
                  let v = [value];
                  console.log("val = ", v, this.state[v], this.state, index);
                  return (
                    <li key={index}>
                      {value} : <input type="number" id={value} onChange={this.changeInput} value={this.state[v]} />
                      <button onClick={async () => {await this.updateVariable(this.state[v], index)} } id={value}>Update</button>
                    </li>);
                })}
                {/* Value:{this.state.varValue}
                Name: {this.state.varName} */}
                {this.state.selectedNodeHTML}
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

          </div>

          {(this.state.isRoleOwner &&
            this.state.altVersionExists &&
            (this.state.chgApprovalOutcome !== 1) &&
            (!Number.isNaN(this.state.chgApprovalOutcome)) &&
            (this.state.hasApprovedChg === 0) &&
            (this.state.chgType === 'Private')
          ) ?
            <>
              <p>A private change request has been registered: please switch to new version by clicking below.
              </p>

              <Button onClick={this.handleProjSwitch}>Switch to new version of the projection</Button>
            </> :
            <></>
          }

          {(this.state.isRoleOwner &&
            this.state.altVersionExists &&
            (this.state.chgApprovalOutcome !== 1) &&
            (!Number.isNaN(this.state.chgApprovalOutcome)) &&
            (this.state.hasApprovedChg === 0) &&
            (this.state.chgType !== 'Private')

          ) ?
            <>
              <p>A change request has been accepted by participants: please switch to new version by clicking below.
              </p>

              <Button onClick={this.handleProjSwitch}>Switch to new version of the projection</Button>

            </> :
            <></>
          }


          {(this.state.isRoleOwner &&
            this.state.altVersionExists &&
            (this.state.chgApprovalOutcome !== 1) &&
            (!Number.isNaN(this.state.chgApprovalOutcome) &&
              (this.state.hasApprovedChg === 1))) ?
            <>
              <p>Waiting for initiator switch.</p>
              <div style={{ 'marginTop': '60vh' }}>
                <SolarSystemLoading color={'#ff7900'} />
              </div>
            </> :
            <></>
          }


          <div style={(this.state.isRoleOwner &&
            this.state.altVersionExists & (this.state.chgApprovalOutcome === 1) & (this.state.chgStatus !== 4)) ? {} : { display: 'none' }}>
            {
              this.state.iamTheInitiator ?
                <div>
                  <p> Dear change initiator, your change request has been approved.
                    Please click below to change the public view onchain.
                  </p>
                  <Button onClick={this.finalSwitchProj}>1./ Click me to compute public view</Button>
                  <Button onClick={this.uploadOnChain}>2./ Click me to switch projection onchain</Button>
                </div> :
                <>
                  <p>Waiting for initiator switch.</p>
                  <div style={{ 'marginTop': '60vh' }}>
                    <SolarSystemLoading color={'#ff7900'} />
                  </div>

                </>}
          </div>
          <div>
          </div>

          <div style={((this.state.owner === this.state.addressProj) && this.state.altVersionExists & (this.state.chgApprovalOutcome !== 1) & (this.state.hasApproved === 1)) ? {} : { display: 'none' }}>
            <p>Successful user projection. Waiting for other participants submissions.</p>
            <div style={{ 'marginTop': '60vh' }}>
              <SolarSystemLoading color={'#ff7900'} />
            </div>
          </div>

        </div>
      </div>
    </div>;
  }
}

export default DCRgraphG