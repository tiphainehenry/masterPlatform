import React from 'react';

import activityUpdHelpers from './utils_ActivityUpdHelpers';
import cytoMenuHelpers from './utils_CytoMenuHelpers';
import changeManager from './utils_ChangeManager';
import dcrHelpers from './utils_dcrHelpers';

import { getMenuStyle } from './utils_ContextMenuHelpers';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons'

import { Card, Button, Row, Col, Form, Container } from 'react-bootstrap';
import Legend from './Legend';
import SimpleLoader from './SimpleLoader';

import axios from 'axios';
import AdminRoleManager from '../contracts/AdminRoleManager.json';
import PublicDCRManager from "../contracts/PublicDCRManager.json";
import Authentification from './Authentification'


import getWeb3 from '../getWeb3';
import ipfs from '../ipfs';

import { default as ReactSelect } from "react-select";
import { components } from "react-select";

import Option from './Option';

import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';
import contextMenus from 'cytoscape-context-menus';
import 'cytoscape-context-menus/cytoscape-context-menus.css';

import COSEBilkent from 'cytoscape-cose-bilkent';
import Dagre from 'cytoscape-dagre'
import Klay from 'cytoscape-klay'


Cytoscape.use(Dagre)
Cytoscape.use(Klay)
Cytoscape.use(COSEBilkent);
Cytoscape.use(contextMenus);

var node_style = require('../style/nodeStyle.json');
var edge_style = require('../style/edgeStyle.json');
var cyto_style = require('../style/cytoStyle.json')['edit'];

var ProcessDB = require('../projections/DCR_Projections.json');


/**
 * Template component to edit a projection
 */
class EditionDeck extends React.Component {

  /**
   * Loads all editing functions from the utils folder.
   */
  constructor(props) {
    super(props);

    this.state = {
      auth: {},

      iterator: 0,

      data: ProcessDB[Object.keys(ProcessDB)[0]]['Global'],
      processID: Object.keys(ProcessDB)[0],
      projectionID: 'Global',

      elemClicked: {
        id: '',
        activityName: '',
        rawActivity: '',
        classes: '',
        type: '',
        isChoreo: ''
      },

      numSelected: 0,


      tenantName: '',

      choreographyNames: {
        sender: '',
        receiver: '',
      },

      markings: {
        included: 0,
        executed: 0,
        pending: 0
      },

      newActivityCnt: 0,

      source: { ID: '', type: '' },
      target: { ID: '', type: '' },
      src: 'edition-deck',

      web3: null,
      accounts: null,
      contractRole: null,
      contractProcess: null,

      optionSelected: null,
      roleOptions:[],
      roleMaps: [],

      roles: [],
      allRegisteredRoles:[],

      dataFields:[],

      hashPublicReq: '',
      publicHash: '',

      chgStatus: 'loading',
      test: 'loading',
      chgEndorsement: 'loading',

      WKFValue: '',

      roleLoading: 'loading'

    };


    /// Activity update functions
    this.updActivity = cytoMenuHelpers.updActivity.bind(this);
    this.handleActivityName = activityUpdHelpers.handleActivityName.bind(this);
    this.handleTenant = activityUpdHelpers.handleTenant.bind(this);
    this.handleSender = activityUpdHelpers.handleSender.bind(this);
    this.handleReceiver = activityUpdHelpers.handleReceiver.bind(this);
    this.handleMI = activityUpdHelpers.handleMI.bind(this);
    this.handleME = activityUpdHelpers.handleME.bind(this);
    this.handleMP = activityUpdHelpers.handleMP.bind(this);

    this.computeRoles = dcrHelpers.computeRoles.bind(this);
    this.cmpAccountRoles = dcrHelpers.cmpAccountRoles.bind(this);
    this.setUpNodeListeners = dcrHelpers.setUpNodeListeners.bind(this);
    this.setUpEdgeListeners = dcrHelpers.setUpEdgeListeners.bind(this);
    this.switchDest = dcrHelpers.switchDest.bind(this);

    /// Remove activity or relation
    this.remove = cytoMenuHelpers.remove.bind(this);

    /// Add activity
    this.addLocalActivity = cytoMenuHelpers.addLocalActivity.bind(this);
    this.addChoreoActivity = cytoMenuHelpers.addChoreoActivity.bind(this);

    // Add relation
    this.addRelation = cytoMenuHelpers.addRelation.bind(this);
    this.addCondition = cytoMenuHelpers.addCondition.bind(this);
    this.addMilestone = cytoMenuHelpers.addMilestone.bind(this);
    this.addResponse = cytoMenuHelpers.addResponse.bind(this);
    this.addInclude = cytoMenuHelpers.addInclude.bind(this);
    this.addExclude = cytoMenuHelpers.addExclude.bind(this);

    this.getMenuStyle = getMenuStyle.bind(this);

    this.saveGraph = this.saveGraph.bind(this);
    this.privateUpd = this.privateUpd.bind(this);
    this.privateGraphUpd = changeManager.privateGraphUpd.bind(this);
    this.publicGraphUpd = changeManager.publicGraphUpd.bind(this);

    this.publicUpd = this.publicUpd.bind(this);

    this.loadSCs = this.loadSCs.bind(this);

    this.childElement = React.createRef()
    this.getStatus = this.getStatus.bind(this)


  }


  /**
 * Instantiates component with the right process and projection view.
 */
  componentWillMount() {
    //console.log('[INFO] componentWillMount starts');
    this.loadSCs().then(res=> 
      {
        var roleOptions = [];

        this.state.allRegisteredRoles.forEach((r)=>{
          var newOption = {'value':r, 'label':r};
          roleOptions.push(newOption);
        })

        this.setState({'roleOptions':roleOptions});
      }  

);


    var processID = this.props.match.params.pid;
    var projectionID = this.props.match.params.rid;

    this.setState({
      'processID': processID,
      'projectionID': projectionID,
      'data': ProcessDB[processID][projectionID]['init']['data'],
      'publicHash': ProcessDB[processID]['hash'],
    });

  }

  getStatus = auth => this.setState({ auth })

  async loadSCs() {
    try {
      //console.log('[INFO] loadSCs starts');

      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      //console.log('[INFO] accounts:', accounts);

      const networkId = await web3.eth.net.getId();
      const adminNetwork = AdminRoleManager.networks[networkId];
      const adminInstance = new web3.eth.Contract(
        AdminRoleManager.abi,
        adminNetwork && adminNetwork.address,
      );

      this.setState({ web3, accounts, contractRole: adminInstance });

      // get list of addresses
      var roles = await adminInstance.methods.getAccountRoles().call();
  
      this.cmpAccountRoles(roles);


      // fetch participants addresses
      const participantsData = await adminInstance.methods.getRoles().call()
      var addresses = []
      participantsData.forEach(line => {
          var val = line.split('///')[1];
          if(val.slice(0,2)!='0x'){
            val= '0x'+val;
          }
          addresses.push(val);
        });

      // fetch list of roles registered per address
      var roles = [];
      for(var i=0; i<addresses.length; i++){
          const addressRoles = await adminInstance.methods.getElemRoles(addresses[i]).call();
          for(var j=0; j<addressRoles.length; j++){
              if(!roles.includes(addressRoles[j])){
                  roles.push(addressRoles[j]);            
              }
          }
      }

      this.setState({
          allRegisteredRoles:roles,
          addresses:addresses
      })
     


      const processNetwork = PublicDCRManager.networks[networkId];
      const processInstance = new web3.eth.Contract(
        PublicDCRManager.abi,
        processNetwork && processNetwork.address,
      );

      this.setState({ web3, accounts, contractProcess: processInstance });


      await processInstance.methods.getChangeArgs(this.state.publicHash).call()
        .then(res => {
          this.setState({
            chgStatus: res.ChangeValue,
            chgEndorsement: res.ChangeEndorsement,
            WKFValue: res.WKFValue,
            test: res.Test
          })

        });


      processInstance.events.RequestChange().on('data', (event) => {
        //console.log(event);
      })
        .on('error', console.error);

    }
    catch (error) {
      console.log(error);
    }
  }



  /**
   * Setting up the environment:
   * - Fits the graph display to the window, 
   * - Activates the editing menu, and sets up click listeners,
   * - Updates the total number of new activities to keep the counter updated for second changes.
   */
  componentDidMount = async () => {
    this.cy.fit();
    this.cy.contextMenus(this.getMenuStyle());


    this.setUpNodeListeners();
    this.setUpEdgeListeners();

    var newActivityCnt = 0;
    this.cy.nodes().forEach(function (ele) {
      if (ele['_private']['data']['id'].includes('NewActivity')) {
        newActivityCnt++;
      }

    });
    this.setState({
      newActivityCnt: newActivityCnt,
      roleLoading: 'done'
    });
  };


  privateUpd(data) {
    // generate vect, text extraction (role, role mapping, global/events) , and save to new version
    axios.post(`http://localhost:5000/privateGraphUpd`,
      data,
      { "headers": { "Access-Control-Allow-Origin": "*" } }
    );
  }

  publicUpd(data, addressesToNotify) {
    var hash = this.state.hash;
    ipfs.files.add(data)
      .then(res => {
        hash = res[0].hash;
        //alert(hash);
        this.setState({ hashPublicReq: hash });
        return ipfs.files.cat(hash)
      })
      .then(output => {
        //console.log('retrieved public req data:', JSON.parse(output));
        //console.log('retrieved hash:', hash);

        console.log(this.state.accounts[0]);
        console.log(addressesToNotify);
        console.log(this.state.publicHash + ',' + hash);

        this.state.contractProcess.methods.requestChange(this.state.accounts[0], addressesToNotify, this.state.publicHash + ',' + hash, this.state.publicHash, hash).send({
          from: this.state.accounts[0]
        }, (error) => {
          console.log(error);
        });

      })
  }

  /**
 * Switcher function to save graphs (whether private storage or BC trigger for negociation).
 * We check the graph subgraph type to assess if we need to trigger the SC negociation stage. 
 * If one of the subgraph elems is a choreography, then we will need to call the SC for peer concertation. 
 * Otherwise we can update the private projection directly. 
 */

  async saveGraph() {
    var publicUpd = false;
    var publicNodes = [];
    this.cy.elements().forEach(function (ele) {
      //console.log(ele);
      console.log(ele['_private']['classes'])

      if (ele['_private']['classes'].has('type_choreography') && ele['_private']['classes'].has('subgraph')) {

        publicUpd = true;
        var splElem = ele['_private']['data']['name'].trim().split(' ');
        var cleanedEle = []
        splElem.forEach(function (ele) {
          if (ele !== "") {
            cleanedEle.push(ele);
          }
        })

        publicNodes.push({
          'name': cleanedEle[1],
          'src': cleanedEle[0],
          'tgt': cleanedEle[2]
        });
      }
    });

    if (window.confirm('Confirm new graph version?')) {

      if (publicUpd) {
        this.publicGraphUpd(publicNodes);
      }
      else {
        this.privateGraphUpd();
        console.log('new graph version saved!')

      }

    }

    else {
      console.log('save aborted');
    }

  }


  addInput = () => {

    var dataFields = this.state.dataFields;

    dataFields.push(        {
      type: "text",
      value: ""
    }
    );

    this.setState(dataFields);
  };

  handleDataFieldChange = e => {
    e.preventDefault();

    const index = e.target.id;

    const newArr = this.state.dataFields.slice();
    newArr[index].value = e.target.value;

    this.setState({dataFields:newArr});

  };


  handleReceiverChange = (selected) => {
    this.setState({
      optionSelected: selected
    });
    console.log("selected");

    console.log(selected);

  };
  ///// Render

  render() {
    const layout = cyto_style['layoutCose'];
    const style = cyto_style['style'];
    const stylesheet = node_style.concat(edge_style);

    return <>
      <div>
        <Authentification status={this.getStatus} />

        <Container fluid  >
          <SimpleLoader load={this.state.chgStatus} type={"bubble-top"} msg={"loading blockchain data"} />

          <div style={(this.state.chgStatus === 'loading') ? { display: 'none' } : {}}>
            <Row >
              <Col >
                <div className="bg-green pt-5 pb-3">

                  <div className='container'>

                    <div className="align-items-center">

                      <h2>Editing [process {this.state.processID}: projection {this.state.projectionID}]</h2>

                      <p>Right click on the graph to see the menu</p>

                      <div>
                        <Row>
                          <Col sm={9}>
                            <Card style={{ height: '95%', 'marginTop': '3vh' }}>
                              <Card.Body >
                                <CytoscapeComponent elements={this.state.data}
                                  stylesheet={stylesheet}
                                  layout={layout}
                                  style={style}
                                  cy={(cy) => { this.cy = cy }}
                                  boxSelectionEnabled={true}
                                />
                              </Card.Body>
                            </Card>

                          </Col>
                          <Col>
                            <Card bg={'light'} style={{ 'marginTop': '3vh', width: '100%' }}>
                              <Card.Body>
                                <Card.Title><h3>Editor Deck</h3></Card.Title>
                                <hr /><br />

                                <Form>
                                  <h4>Activity</h4>

                                  <Form.Label>Activity name</Form.Label>
                                  <Form.Control type="address" onChange={this.handleActivityName} placeholder={'enter activity name'} value={this.state.elemClicked.activityName} />
                                  <hr /><br />

                                  <h4>Assign role</h4>

{this.state.elemClicked.isChoreo ?
<>
<div className="form-group">
  <label className="is-required" for="role">Choreography Sender</label>
  <select className="custom-select" name="view-selector" onChange={this.handleSender} placeholder={"Sender"} value={this.state.choreographyNames.sender}>
  <option value=''> ---</option>
  {
    React.Children.toArray(
      this.state.allRegisteredRoles.map((name, i) => <option key={i}>{name}</option>)
    )
  }
  </select>
</div>

<Button id="switch-btn" onClick={() => this.switchDest()} ><FontAwesomeIcon icon={faExchangeAlt} /></Button>
<br />

<div className="form-group">
  <label className="is-required" for="role">Choreography Receiver</label>
  <ReactSelect
    options={this.state.roleOptions}
    isMulti
    closeMenuOnSelect={false}
    hideSelectedOptions={false}
    components={{
      Option
    }}
    onChange={this.handleReceiverChange}
    allowSelectAll={true}
    value={this.state.optionSelected}

/>
</div></>
:<>                                
<div className="form-group">
<label className="is-required" for="role">Private role</label>
<select className="custom-select" name="view-selector" onChange={this.handleTenant} placeholder={"Tenant"} value={this.state.tenantName} >
<option value=''> ---</option>
{
  React.Children.toArray(
    this.state.allRegisteredRoles.map((name, i) => <option key={i}>{name}</option>)
  )
}
</select>
</div>
</>}

                                  <hr /><br />

                                  <h4>Marking</h4>

                                  <Form.Group controlId="formBasicEmail">
                                    <Form.Check
                                      onChange={this.handleMI}
                                      type={'checkbox'}
                                      id={`default-checkbox`}
                                      label={`included`}
                                    />
                                    <Form.Check
                                      onChange={this.handleME}
                                      type={'checkbox'}
                                      id={`default-checkbox`}
                                      label={`executed`}
                                    />
                                    <Form.Check
                                      onChange={this.handleMP}
                                      type={'checkbox'}
                                      id={`default-checkbox`}
                                      label={`pending`}
                                    />
                                  </Form.Group>

                                </Form>

                                <Button onClick={this.updActivity}>update activity</Button>

                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </div>
                      <Button onClick={this.saveGraph}>save new version</Button>
                    </div>
                    <Legend src={this.state.src} />

                  </div>
                </div>

              </Col>
            </Row>
          </div>
        </Container>

      </div>

    </>

  }
}

export default EditionDeck
