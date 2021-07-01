import React from 'react';

import activityUpdHelpers from './utils_ActivityUpdHelpers';
import cytoMenuHelpers from './utils_CytoMenuHelpers';
import { getMenuStyle } from './utils_ContextMenuHelpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCommentsDollar, faExchangeAlt } from '@fortawesome/free-solid-svg-icons'

import Header from './Header';

import { Card, Button, Row, Col, Form, Container } from 'react-bootstrap';
import Legend from './Legend';


import axios from 'axios';
import AdminRoleManager from '../contracts/AdminRoleManager.json';
import PublicDCRManager from "../contracts/PublicDCRManager.json";

import getWeb3 from '../getWeb3';
import ipfs from '../ipfs';


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
      iterator: 0,

      data: ProcessDB[Object.keys(ProcessDB)[0]]['Global'],
      processID: Object.keys(ProcessDB)[0],
      projectionID: 'Global',

      elemClicked: {
        id: '',
        activityName: '',
        classes: '',
        type: ''
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

      roleMaps:[],

      roles:[],

      hashPublicReq:'',
      publicHash:''


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
    this.privateGraphUpd = this.privateGraphUpd.bind(this);
    this.requestChange = this.requestChange.bind(this);

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
      newActivityCnt:newActivityCnt
    });

  };

  /**
   * Instanciates component with the right process and projection view.
   */
  componentWillMount() {

    this.getRoles()

    var processID = this.props.match.params.pid;
    var projectionID = this.props.match.params.rid;

    this.setState({
      'processID': processID,
      'projectionID': projectionID,
      'data': ProcessDB[processID][projectionID]['init']['data'],
      'publicHash':ProcessDB[processID]['hash']
    });

    //console.log(this.props.location);
    //if (typeof (this.props.location.state) !== 'undefined') {
    //  if (typeof (this.props.location.state['currentProcess'][1]) !== 'undefined') {
    //    var processID = this.props.location.state['currentProcess'][1];
    //    var projectionID = this.props.location.state['currentInstance'];

    //    this.setState({
    //      'processID': processID,
    //      'processName': this.props.location.state['currentProcess'][1],
    //      'projectionID': projectionID,
    //      'data': ProcessDB[processID][projectionID]['init']['data']
    //    });
    //  }
    }

    async getRoles() {

      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        const networkId = await web3.eth.net.getId();
        const adminNetwork = AdminRoleManager.networks[networkId];
        const adminInstance = new web3.eth.Contract(
          AdminRoleManager.abi,
          adminNetwork && adminNetwork.address,
        );
    
        this.setState({ web3, accounts, contractRole: adminInstance });

        const processNetwork = PublicDCRManager.networks[networkId];
        const processInstance = new web3.eth.Contract(
          PublicDCRManager.abi,
          processNetwork && processNetwork.address,
        );

        this.setState({ web3, accounts, contractProcess: processInstance });

        
        var roles = await adminInstance.methods.getRoles().call()

        var roleMaps = []
        var tmpRoles = []
        var tmpAddress = []
        roles.forEach(line => {
          var r = line.split('///')[0];
          var a = line.split('///')[1];
          tmpRoles.push(r);
          tmpAddress.push(a);
          roleMaps.push({'role':r, 'address':a});
        });
        this.setState({ roles: tmpRoles, addresses: tmpAddress, roleMaps:roleMaps })

        processInstance.events.RequestChange().on('data', (event) => {
          console.log(event);    
        })
        .on('error', console.error);

      } catch (error) {
        //alert(
        //  `Failed to load web3, accounts, or contract. Check console for details.`,
        //);
        console.error(error);
      }
    }

    switchDest() {
      const tmp = this.state.choreographyNames.sender
      this.setState({
        choreographyNames: {
          sender: this.state.choreographyNames.receiver,
          receiver: tmp
        }
      })
    }
  
  
  //////////  LISTENERS /////////////////

  /**
   * Listeners to monitor node click events.
   */
  setUpNodeListeners = () => {

    this.cy.on('click', 'node', (event, data) => {
      //getClikedNode
      if ((!event.target['_private']['classes'].has('selected')) && (this.state.numSelected < 2)) {
        console.log(event.target['_private']['data']['id'] + ' clicked');

        var type = '';
        if (event.target['_private']['classes'].has('subgraph')) {
          type = 'subgraph';
        }

        /// monitor clicked elements
        switch (this.state.numSelected) {
          case 0:
            console.log('source');
            this.setState({
              source: {
                ID: event.target['_private']['data']['id'],
                type: type
              }
            });
            break;
          case 1:
            console.log('target');
            this.setState({
              target: {
                ID: event.target['_private']['data']['id'],
                type: type
              }
            });
            break;
          default: console.log('num selected nodes: ' + this.state.numSelected);
        }

        // update states
        this.cy.getElementById(event.target['_private']['data']['id']).addClass('selected');

        this.setState({
          elemClicked: {
            id: event.target['_private']['data']['id'],
            activityName: event.target['_private']['data']['name'],
            classes: event.target['_private']['classes'],
            type: event.target['_private']['group']
          },
          numSelected: this.state.numSelected + 1
        });
      }

      else if (event.target['_private']['classes'].has('selected')) {
        this.cy.getElementById(event.target['_private']['data']['id']).removeClass('selected');

        if (this.state.numSelected !== 1) {
          this.setState({ numSelected: this.state.numSelected - 1 });
        }

      }
      else {
        console.log('two elements already selected');
      }
    });

  }

  /**
   * Listeners to monitor edge/relations click events.
   */
  setUpEdgeListeners = () => {
    this.cy.on('click', 'edge', (event, data) => {
      console.log(event.target['_private']['data']['id'] + ' clicked');
      var idSelected = event.target['_private']['data']['id'];
      var elemType = event.target['_private']['group'];

      this.setState({
        elemClicked: {
          id: idSelected,
          activityName: '',
          classes: '',
          type: elemType
        }
      })
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
      if (ele['_private']['classes'].has('choreography') && ele['_private']['classes'].has('subgraph')) {
        publicUpd = true;
        var splElem = ele['_private']['data']['name'].trim().split(' '); 
        var cleanedEle = []
        splElem.forEach(function (ele) {
          if(ele != ""){
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

    if (publicUpd) {
      alert('choreography task - negotiation launched');

      console.log(publicNodes);

      var roles = this.state.roleMaps;
      var addressesToNotify = []
      publicNodes.forEach(function(node){
        roles.forEach(function(r){
          if ((node['src']==r['role'])||(node['tgt']==r['role'])) {
            addressesToNotify.push(r['address']);
          }
        })
      });
      
      // generate cyto data and save to IPFS
      var newData = [];
      this.cy.elements().forEach(function (ele) {
        var newEle = {
          "data": ele['_private']['data'],
          "group": ele['_private']['group'],// group can be two types: nodes == activity, or edges == relation
        };

        console.log(newEle);

        if (newEle.data.name[0]==('!'||'?')){
          console.log(newEle.data.name);

          var acName=newEle.data.name.split('(')[1].split(',')[0];
          var sender=newEle.data.name.split(', ')[1].split('>')[0].replace('-','').replace('-','');
          var receiver=newEle.data.name.split('>')[1].replace('*','').replace(')','').replace(' ','');

          newEle.data = {
            'id':newEle.data.id.slice(0,-1),
            'name':sender+'\n'+acName+'\n'+receiver,
            'nbr':0,
            'properName':sender+'\n'+acName+'\n'+receiver
          }

        }

        var classes = Array.from(ele['_private']['classes']).join(' ');
        if (classes !== '') {
          newEle['classes'] = classes;
        }
        newData.push(newEle);
      });

      var hash=this.state.hash;

      ipfs.files.add(Buffer.from(JSON.stringify(newData)))
      .then(res => {
      hash = res[0].hash;
      this.setState({ hashPublicReq: hash });
      return ipfs.files.cat(hash)
     })
    .then(output => {
      console.log('retrieved public req data:', JSON.parse(output));

      this.requestChange(addressesToNotify,this.state.publicHash+"|"+hash);
  
    })

    }
    else {
      this.privateGraphUpd();
    }
  }


  async requestChange(addressesToNotify,hashes){
    // request change
    console.log(hashes);
    this.state.contractProcess.methods.requestChange(addressesToNotify, hashes).send({
      from: this.state.accounts[0]
    }, (error) => {
              console.log(error);
    }); //storehash 

  // send request to list of addresses with ipfs hash of public nodes and relations. 

  }

  /**
   * Private graph update processing > calls the API to update the markings and nodes.
   * 
   */
  privateGraphUpd() {

    if (window.confirm('Confirm new graph version?')) {

      var newData = [];

      // retrieve data 
      this.cy.elements().forEach(function (ele) {
        var newEle = {
          "data": ele['_private']['data'],
          "group": ele['_private']['group'],// group can be two types: nodes == activity, or edges == relation
        };

        var classes = Array.from(ele['_private']['classes']).join(' ');
        if (classes !== '') {
          newEle['classes'] = classes;
        }
        newData.push(newEle);
      });

      // generate vect, text extraction (role, role mapping, global/events) , and save to new version
      axios.post(`http://localhost:5000/privateGraphUpd`,
        {
          newData: newData,
          projID: this.state.projectionID,
          processID: this.state.processID
        },
        { "headers": { "Access-Control-Allow-Origin": "*" } }
      );

      console.log('new graph version saved!')
      //window.location = '/welcomeinstance';
    }
    else {
      console.log('save aborted');
    }
  }

  ///// Render

  render() {
    const layout = cyto_style['layoutCose'];
    const style = cyto_style['style'];
    const stylesheet = node_style.concat(edge_style);
    
    var roles = []
    if (this.state.roles)
      roles = this.state.roles.map((x, y) => <option key={y}>{x}</option>)

    console.log(this.state);
    return <>
      <div>
      <Container fluid >
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

                            <Card.Text>
                              <Form>
                                <h4>Activity</h4>

                                <Form.Label>Activity name</Form.Label>
                                <Form.Control type="address" onChange={this.handleActivityName} placeholder={'enter activity name'} value={this.state.elemClicked.activityName} />

                                <hr style={{ "size": "5px" }} /><br />
                                <h4>Assign role</h4>
                                <div class="form-group">
                                  <label class="is-required" for="role">Private role</label>
                                  <select class="custom-select" name="view-selector" onChange={this.handleTenant} placeholder={"Tenant"} value={this.state.tenantName} >
                                  <option value=''> ---</option>{roles}
                                  </select>
                                </div>
                                <br />

                                <div class="form-group">
                                  <label class="is-required" for="role">Choreography Sender</label>
                                  <select class="custom-select" name="view-selector" onChange={this.handleSender} placeholder={"Sender"} value={this.state.choreographyNames.sender}>
                                  <option value=''> ---</option>{roles}
                                  </select>
                                </div>

                                <Button id="switch-btn" onClick={() => this.switchDest()} ><FontAwesomeIcon icon={faExchangeAlt} /></Button>
                                <br />
                                <div class="form-group">
                                  <label class="is-required" for="role">Choreography Receiver</label>
                                  <select class="custom-select" name="view-selector" onChange={this.handleReceiver} placeholder={"Receiver"} value={this.state.choreographyNames.receiver}>
                                  <option value=''> ---</option>{roles}
                                  </select>
                                </div>
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

                            </Card.Text>

                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                  <Button onClick={this.saveGraph}>save new version</Button>
                    </div>
                    <Legend src={this.state.src}/>

                    </div>
                    </div>

                    </Col>
        </Row>
      </Container>

                    </div>

    </>

  }
}

export default EditionDeck
