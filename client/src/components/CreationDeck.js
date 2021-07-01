import React from 'react';
import '../style/App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons'
import activityUpdHelpers from './utils_ActivityUpdHelpers';
import cytoMenuHelpers from './utils_CytoMenuHelpers';
import { getMenuStyle } from './utils_ContextMenuHelpers';

import Header from './Header';

import { Card, Button, Row, Col, Form, Container } from 'react-bootstrap';
import SidebarModel from './SidebarModel';
import LoadToBC from './LoadToBC';

import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';

import 'cytoscape-context-menus/cytoscape-context-menus.css';

import axios from 'axios';
import COSEBilkent from 'cytoscape-cose-bilkent';
import Dagre from 'cytoscape-dagre'
import Klay from 'cytoscape-klay'

import AdminRoleManager from '../contracts/AdminRoleManager.json';
import getWeb3 from '../getWeb3';
import ipfs from '../ipfs';

import Legend from './Legend';
import LoadToBCL from './LoadToBC';

Cytoscape.use(Dagre)
Cytoscape.use(Klay)
Cytoscape.use(COSEBilkent);
// Cytoscape.use(contextMenus);


var node_style = require('../style/nodeStyle.json');
var edge_style = require('../style/edgeStyle.json');
var cyto_style = require('../style/cytoStyle.json')['edit'];

var ProcessDB = require('../projections/DCR_Projections.json');


/**
 * Template component to edit a projection
 */
class CreationDeck extends React.Component {

  /**
   * Loads all editing functions from the utils folder.
   */
  constructor(props) {
    super(props);
    console.log(Object.keys(ProcessDB)[0]);
    console.log(ProcessDB[Object.keys(ProcessDB)[0]]);
    this.loadToBC = React.createRef()

    this.state = {
      iterator: 0,
      data: [],
      processID: this.props.location.state['currentProcess']||JSON.parse(localStorage.getItem('processID')),
      ipfsHash: JSON.parse(localStorage.getItem('ipfsHash')) || null,
      buffer: '',
      ethAddress: '',
      blockNumber: '',
      transactionHash: '',
      gasUsed: '',
      txReceipt: '',
      web3: null,
      accounts: null,
      contract: null,

      processName: this.props.location.state['currentProcess']||JSON.parse(localStorage.getItem('processID')),
      projectionID: 'Global',
      roleMaps:{},
      edges: {
        condition: ' -->* ',
        milestone: ' --<> ',
        exclude: ' -->% ',
        response: ' *--> ',
        include: ' -->+ '
      },
      elemClicked: {
        id: '',
        activityName: '',
        classes: '',
        type: ''
      },

      roles:[],

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

      selectValue: 'g_to_p',

      newActivityCnt: 0,
      src: 'creation-deck',

      source: { ID: '', type: '' },
      target: { ID: '', type: '' },

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

    this.fileUpload = this.fileUpload.bind(this);
    this.privateGraphUpd = this.privateGraphUpd.bind(this);
    this.saveToLibrary = this.saveToLibrary.bind(this);
    this.postLibrary = this.postLibrary.bind(this);

    this.createFile = this.createFile.bind(this);
    this.instantiate= this.instantiate.bind(this);

    this.onIPFSSubmit = this.onIPFSSubmit.bind(this);
    this.onChangeView = this.onChangeView.bind(this);
  }

  /**
   * Setting up the environment:
   * - Fits the graph display to the window, 
   * - Activates the editing menu, and sets up click listeners,
   * - Updates the total number of new activities to keep the counter updated for second changes.
   * - Load the template if it has already been saved
   */
  componentDidMount = async () => {
    this.cy.fit();
    this.cy.remove('nodes')
    this.cy.contextMenus(this.getMenuStyle());
    this.setUpNodeListeners();
    this.setUpEdgeListeners();
    this.getTemplate();

  };

  /**
   * Instanciates component with the right process and projection view.
   */
  componentWillMount() {

    this.getRoles()

  };

  onChangeView(e) {
    this.setState({ selectValue: e.target.value });
  }

  async getRoles() {

    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = AdminRoleManager.networks[networkId];
      const instance = new web3.eth.Contract(
        AdminRoleManager.abi,
        deployedNetwork && deployedNetwork.address,
      );


      this.setState({ web3, accounts, contract: instance });

      var roles = await instance.methods.getRoles().call()
      var tmpRoles = []
      var tmpAddress = []
      roles.forEach(line => {
        tmpRoles.push(line.split('///')[0])
        tmpAddress.push(line.split('///')[1])
      });
      this.setState({ roles: tmpRoles, addresses: tmpAddress })
    } catch (error) {
      //alert(
      //  `Failed to load web3, accounts, or contract. Check console for details.`,
      //);
      console.error(error);
    }
  }
  onIPFSSubmit = async (event) => {
    event.preventDefault();

    //save document to IPFS,return its hash#, and set hash# to state
    //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#add 

    var input = ProcessDB[this.state.processID]['Public']['data'];

    try{
        ipfs.files.add(Buffer.from(JSON.stringify(input)))
        .then(res => {
          const hash = res[0].hash
  
          this.setState({
            ipfsHash: hash
          }, () => {
            localStorage.setItem('ipfsHash', JSON.stringify(this.state.ipfsHash))
          });
  
          axios.post(`http://localhost:5000/saveHash`,
            {
              "hash": hash,
              "processId": this.state.processID,
            },
            { "headers": { "Access-Control-Allow-Origin": "*" } }
          );
  
          return ipfs.files.cat(hash)
        })
        .then(output => {
          console.log(JSON.parse(output));
          alert('Saved to IPFS')
        })
      }
      catch(error){
        alert('Is the VPN on?');
      }   

  }; //onIPFSSubmit 

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
        var name = event.target['_private']['data']['name'].split(' ')
        if (name.length > 1) {
          name = name[1]
        }
        this.setState({
          elemClicked: {
            id: event.target['_private']['data']['id'],
            activityName: name,
            classes: event.target['_private']['classes'],
            type: event.target['_private']['group']
          },
          numSelected: this.state.numSelected + 1
        });
      }
      else if (event.target['_private']['classes'].has('selected')) {
        this.cy.$('selected').removeClass('selected')
        this.setState({ source: { ID: "", type: "" }, target: { ID: "", type: "" }, numSelected: 0 })
      }
      else {
        this.setState({ numSelected: 0 })
        this.cy.nodes().forEach(ele => ele.removeClass('selected'))
        this.setState({
          source: { ID: "", type: "" },
          target: { ID: "", type: "" }
        })
        console.log('reset selection numselected = ' + this.state.numSelected);
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

  ////////  CALL API    ////////
  /**
   * Instanciate the process in the BC
   * 
   */
  fileUpload(file) {

    const url = `http://localhost:5000/inputFile`;

    const formData = new FormData();

    formData.append('file', file);
    formData.append('processID', this.state.processID);
    formData.append('projType', this.state.selectValue);

    const config = {
      headers: {
        'content-type': 'multipart/form-data',
        'Access-Control-Allow-Origin': '*',
      }
    };

    return axios.post(url, formData, config);
  }
  /**
   * 
   * Get the template data if it already exist in DB
   * @returns 
   * 
   */
  getTemplate() {
    axios.get(`http://localhost:5000/library?processID=` + this.state.processID).then(
      (response) => {
        var result = response;
        if (result.data !== "KO") {
          this.cy.add(result.data)
          this.setState({ newActivityCnt: this.cy.filter('nodes').length })
        }
      },
      (error) => {
        console.log(error);
      }
    );
  }

  /**
   * Save the current graph template in the DB
   * @param {Graph content} data 
   * @returns 
   */
  postLibrary(data) {
    
    const config = {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    };

    axios.post(`http://localhost:5000/library`, { "data": data, "processID": this.state.processID }, config).then(
      (response) => {
        var result = response.data;
        console.log(result);
      },
      (error) => {
        console.log(error);
      }
    ).then(() => {this.privateGraphUpd()});

    return "posted"

  }

  /**
   * Switcher function to save graphs (whether private storage or BC trigger for negociation).
   * We check the graph subgraph type to assess if we need to trigger the SC negociation stage. 
   * If one of the subgraph elems is a choreography, then we will need to call the SC for peer concertation. 
   * Otherwise we can update the private projection directly. 


  /**
   * Private graph update processing > calls the API to update the markings and nodes.
   * 
   */
  privateGraphUpd() {
    if (this.cy.elements().length === 0) {
      window.alert('Graph is empty')
    } else if (window.confirm('Confirm new graph version?')) {

      var newData = [];

      // retrieve data
      var rolelist = new Map()
      this.cy.elements().forEach(function (ele, id) {
        //console.log(ele)
        //console.log("id = " + id);
        var newEle = {};

        //console.log("then id = " + id);

        var tmp='';

        if (ele['_private']['group'] === "nodes") {
          if (ele['_private']['classes'].has("choreography")) {
            id++;
            tmp = ele['_private']['data']['name'].split(' ');
            tmp = tmp.filter(e => e !== "");
            rolelist.set(tmp[0], this.state.addresses[this.state.roles.indexOf(tmp[0])]);
            rolelist.set(tmp[2], this.state.addresses[this.state.roles.indexOf(tmp[2])]);
            newEle = {
              "name": "e" + id + "[" + tmp[1] + " src=" + tmp[0] + " tgt=" + tmp[2] + "]\n"
            }
            ele['_private']['data']['name'] = "e" + id;
          } else {

            var tmp = ele['_private']['data']['name'].split(' ');
            rolelist.set(tmp[0], this.state.addresses[this.state.roles.indexOf(tmp[0])]);
            newEle = {
              "name": '"' + tmp[0] + '"' + " [role=" + tmp[1] + "]\n",
            };
          }
        } else if (ele['_private']['group'] === "edges") {
            var src = this.findName(ele['_private']['data']['source'])
            var trg = this.findName(ele['_private']['data']['target'])
            var link = this.state.edges[ele['_private']['classes'].values().next().value]
            newEle = { "link": src + link + trg + '\n' }
        }
          newData.push(newEle);
      }.bind(this));

      this.createFile(newData, rolelist)
    }
    else {
      console.log('save aborted');
    }
  }


  /**
   * Compares IDs and names of the edges to detect inconsistants names
   * 
   */
  findName(id) {
    const node = this.cy.getElementById(id)
    if (node["_private"]["classes"].has("choreography")) {
      return (node["_private"]["data"]["name"] + "")
    } else {
      const name = node["_private"]["data"]["name"].split(' ')
      console.log(name[0]);
      return (name[0])
    }
  }

  /**
     * Create an input File to send to the API
     * 
     */
  createFile(data, rolelist) {
    //e.preventDefault() // Stop form submit

    var arrayEvent = []
    var arrayLink = []
    const it = rolelist.keys()
    for (const key of it) {
        arrayEvent.push("pk[role=" + key + "]=0x" + rolelist.get(key)+'\n')
    }
    data.forEach(line => {
      if (line.hasOwnProperty('name'))
        arrayEvent.push(line['name']+'\n')
      else
        arrayLink.push(line['link']+'\n')
    })
    const newdata = arrayEvent.concat(arrayLink)
    const file = new File(newdata, 'creationDeck.txt', { type: "text/plain" });

    this.fileUpload(file).then((response) => {
      console.log(response.data);
      if (response.data === "ok") {
        // save to BC
        console.log('projection done');
        //this.loadToBC.current.handleCreateWkf();
      }
    })

    //return (new File(newdata, 'creationDeck.txt', { type: "text/plain" }))
  }

  async instantiate(){
    this.loadToBC.current.handleCreateWkf();
    console.log("is ok loadtoBC");
  }

  /**
  * Switch the sender and receiver of the selected activity
  * 
  */
  switchDest() {
    const tmp = this.state.choreographyNames.sender
    this.setState({
      choreographyNames: {
        sender: this.state.choreographyNames.receiver,
        receiver: tmp
      }
    })
  }
  /**
  * Save a graph as a template and send it to the API
  * 
  */
  saveToLibrary() {
    const tmp = this.cy.json(true)
    this.setState({ data: tmp.elements, iterator: 1 })
    // this.cy.remove('nodes')
    this.postLibrary(tmp.elements);
    console.log("saved");

    return "saved"
  }

  ///// Render

  render() {
    const layout = cyto_style['layoutCose'];
    const style = cyto_style['style'];
    const stylesheet = node_style.concat(edge_style);
    var roles = []
    if (this.state.roles)
      roles = this.state.roles.map((x, y) => <option key={y}>{x}</option>)
    return <>
      <div>
        <Header />
        <LoadToBC ref={this.loadToBC} processID={this.state.processID} src={this.state.src}></LoadToBC>

        <Row>
              <SidebarModel />
             

              <div class="col-md-9 ml-sm-auto col-lg-10 px-md-4">
              

              <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 ">

              <Container>

            
                <div class='container'>
                  <h2>Creating [process {this.state.processID}]</h2>

                  <div class="form-group">
                        <label class="is-required" for="role">Select projection type</label>
                        <select class="custom-select" name="view-selector" onChange={e => this.onChangeView(e)}>
                          <option value="g_to_p">Global view</option>
                          <option value="p_to_g">Public view</option>
                        </select>
                        <span class="form-text small text-muted" id="helpTextFile">
                          Public view: declare ONLY the public tasks of the participants.
                          Global view: declare all tasks (public+private).</span>

                  </div>

                  <div className="well">Right click on the graph to see the menu</div>

                  <div>
                    <Row>
                      <Col sm={9}>
                        <Card style={{ height: '95%', 'marginTop': '3vh' }}>
                          <Card.Body >
                            <CytoscapeComponent
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
                  <Button onClick={this.saveToLibrary}>1. Generate projection</Button>

                  <Button onClick={this.onIPFSSubmit}>2. Save public text extraction to IPFS</Button>

                  <LoadToBCL ref={this.loadToBC} ipfsHash={this.state.ipfsHash} processID={this.state.processID} />

                  <Legend src={this.state.src}/>

                </div>
                </Container>
              </div>
              </div>

             </Row>

      </div>
    </>

  }
}

export default CreationDeck
