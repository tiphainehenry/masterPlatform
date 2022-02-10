import React from 'react';
import '../style/App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExchangeAlt } from '@fortawesome/free-solid-svg-icons'
import Authentification from './Authentification'

import activityUpdHelpers from './utils_ActivityUpdHelpers';
import dcrHelpers from './utils_dcrHelpers';

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

import { default as ReactSelect } from "react-select";
import { components } from "react-select";

import Option from './Option';

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
    this.loadToBC = React.createRef()

    this.state = {

      auth: {},
      iterator: 0,
      data: [],
      allRegisteredRoles:[],

      templateID: this.props.match.params.pid,

      processID: JSON.parse(localStorage.getItem('processID')) || '',
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

      processID: JSON.parse(localStorage.getItem('processID')) || '',
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

      optionSelected: null,
      roleOptions:[],

      dataFields:[],
      dataFieldsList:[],

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

      elemClicked: {
        id: '',
        activityName: '',
        rawActivity: '',
        classes: '',
        type: '',
        isChoreo: ''
      },

    };

    this.deleteDataField = this.deleteDataField.bind(this);

    this.cmpAccountRoles = dcrHelpers.cmpAccountRoles.bind(this);

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
    this.remove = cytoMenuHelpers.removeCreate.bind(this);

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
    this.graphUpdate = this.graphUpdate.bind(this);
    this.saveToLibrary = this.saveToLibrary.bind(this);
    this.postLibrary = this.postLibrary.bind(this);

    this.createFile = this.createFile.bind(this);

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
   * Instantiates component with the right process and projection view.
   */
  componentWillMount() {

    this.getRoles().then(res=> 
      {
        var roleOptions = [];

        this.state.allRegisteredRoles.forEach((r)=>{
          var newOption = {'value':r, 'label':r};
          roleOptions.push(newOption);
        })
        this.setState({'roleOptions':roleOptions});
      }
);

  };

  getStatus = auth => this.setState({ auth })


  handleReceiverChange = (selected) => {
    this.setState({
      optionSelected: selected
    });
  };

  onChangeView(e) {
    this.setState({ selectValue: e.target.value });
  }

  onChange(e) {
    if (e.target.name === "address")
        this.setState({ address: e.target.value })
    else if (e.target.name === "name")
        this.setState({ name: e.target.value })
    else if (e.target.name === "selector") {
        this.setState({ selectValue: e.target.value })
        this.setState({ isNew: (e.target.value === "") })
        if (e.target.value !== "") {
            this.getListRoles('0x' + this.state.addresses[this.state.allRegisteredRoles.indexOf(e.target.value)])
        }
    } else if (e.target.name === "isAdmin") {
        this.setState(prevstate => ({ isAdmin: !prevstate.isAdmin }))
    } else if (e.target.name === "newDataField") {
        this.setState({newDataField: e.target.value});
    }
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
      
      // fetch participants addresses
      const participantsData = await instance.methods.getRoles().call();
      console.log(participantsData);
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
          const addressRoles = await instance.methods.getElemRoles(addresses[i]).call();
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
      
    } catch (error) {
      //alert(
      //  `Failed to load web3, accounts, or contract. Check console for details.`,
      //);
      console.error(error);
    }
  }





  //////////  LISTENERS /////////////////

  nodeListener_datafield(node_df){
    if(typeof node_df !== 'undefined'){
      console.log(node_df);
      this.setState(
        {dataFields:node_df},
        );
  
        var line = [];
        for (let l = 0; l < node_df.length; l++) {
            line.push(
                <tr key={l}>
                    <td>{l}</td>
                    <td>{node_df[l].value}</td>
                    <td><Button onClick={() => this.deleteDataField(l)} class="btn btn-danger">Delete</Button></td>
                </tr>)
        }
        this.setState({ "dataFieldsList": line });
    }
    else{
      console.log("no datafield in this node");
      this.setState(
        {dataFields:[]},
        );
        var line = [];
        this.setState({ "dataFieldsList": line });

    }
  }

  nodeListener_activityName(node_actName, node_classes){

    var isChoreo=false;
    var activityName = '';
    if(node_classes.has("type_projChoreo")){
      isChoreo=true;
      activityName = node_actName.split('(')[1].split(',')[0];
    }
    else if((node_classes.has("type_choreography"))){
      isChoreo=true;
      if(node_actName.includes('\n')){
        activityName = node_actName.split('\n')[1];
      }
      else if(node_actName.includes(' ')){
        activityName = node_actName.split(' ')[1];
      }
      else{
        console.log('fails at choreography name split');
      }
    }
    else{
      activityName=node_actName.split(' ')[1];
    }
    return [activityName, isChoreo];
  }

  nodeListener_recipients(node_actName, node_classes){
    var activityName = '';
    if(node_classes.has("type_projChoreo")){
      activityName = node_actName.split('(')[1].split(',')[0];
    }
    else if((node_classes.has("type_choreography"))){
      if(node_actName.includes('\n')){
        activityName = node_actName.split('\n');
      }
      else if(node_actName.includes(' ')){
        activityName = node_actName.split(' ');
      }
      else{
        console.log('fails at choreography name split');
      }

      this.setState({
        choreographyNames:{
          sender: activityName[0],
          receiver:this.state.choreographyNames.receiver
        }
      })
    }
    else{
      if (node_actName.split(' ').length>1){
        try{
          var tenantName=node_actName.split(' ')[0];
          this.setState(tenantName);    
        }
        catch(error){
          console.log(error);
        }
      }
    }


  }



  nodeListener_edges(myID, myClasses){
    var type = '';
    if (myClasses.has('subgraph')) {
      type = 'subgraph';
    }

        /// monitor clicked elements
        switch (this.state.numSelected) {
          case 0:
            console.log('source');
            this.setState({
              source: {
                ID: myID,
                type: type
              }
            });
            break;
          case 1:
            console.log('target');
            this.setState({
              target: {
                ID: myID,
                type: type
              }
            });
            break;
          default: console.log('num selected nodes: ' + this.state.numSelected);
        }    
  }

  nodeListener_is_selected(event){
    console.log(event.target['_private']['data']['id'] + ' clicked');

    this.cy.getElementById(event.target['_private']['data']['id']).addClass('selected');

    // dataFields 
    this.nodeListener_datafield(event.target['_private']['data']['dataFields']);

    // activityName  
    var answer = this.nodeListener_activityName(event.target['_private']['data']['name'],
                                                event.target['_private']['classes']);

    // activityName  
    this.nodeListener_recipients(event.target['_private']['data']['name'],
                                              event.target['_private']['classes']);


    // relations
    this.nodeListener_edges(event.target['_private']['data']['id'], event.target['_private']['classes']);

    // update states
    this.setState({
      elemClicked: {
        id: event.target['_private']['data']['id'],
        activityName: answer[0],
        classes: event.target['_private']['classes'],
        type: event.target['_private']['group'],
        isChoreo: answer[1], 

      },
      numSelected: this.state.numSelected + 1
    });

  }

  /**
   * Listeners to monitor node click events.
   */
  setUpNodeListeners = () => {

    this.cy.on('click', 'node', (event, data) => {

      //getClikedNode
      if ((!event.target['_private']['classes'].has('selected')) && (this.state.numSelected < 2)) {
        this.nodeListener_is_selected(event);
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
   * Instantiate the process in the BC
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
    axios.get(`http://localhost:5000/library?processID=` + this.state.templateID).then(
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

    axios.post(`http://localhost:5000/library`, { 
      "data": data, 
      "processID": this.state.templateID }, 
      config)
      .then(
      (response) => {
        var result = response.data;
        console.log(result);
      },
      (error) => {
        console.log(error);
      }
    ).then(() => {this.graphUpdate()});

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
  graphUpdate() {
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
          if (ele['_private']['classes'].has("choreography")||ele['_private']['classes'].has("type_choreography")) {
            id++;
            tmp = ele['_private']['data']['name'].split(' ');
            tmp = tmp.filter(e => e !== "");

            alert(this.state.addresses);
            rolelist.set(tmp[0], this.state.addresses[this.state.allRegisteredRoles.indexOf(tmp[0])]);
            rolelist.set(tmp[2], this.state.addresses[this.state.allRegisteredRoles.indexOf(tmp[2])]);
            newEle = {
              "name": "e" + id + "[" + tmp[1] + " src=" + tmp[0] + " tgt=" + tmp[2] + "]\n"
            }
            ele['_private']['data']['name'] = "e" + id;
          } else {

            tmp = ele['_private']['data']['name'].split(' ');
            rolelist.set(tmp[0], this.state.addresses[this.state.allRegisteredRoles.indexOf(tmp[0])]);
            newEle = {
              "name": '"' + tmp[0] + '" [role=' + tmp[1] + "]\n",
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
     * Create an input File to send to the API and send to api for projection
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
        console.log('projection done');
      }
    })
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

  addNewField = () => {

    var dataFields = this.state.dataFields;

    dataFields.push(        
      {
        type: "text",
        value: this.state.newDataField
      });

    this.getDataFieldsList();
    this.setState(
      {dataFields:dataFields},
      );
  };

  handleDataFieldChange = e => {
    e.preventDefault();
    const index = e.target.id;
    const newArr = this.state.dataFields.slice();
    newArr[index].value = e.target.value;

    this.setState({dataFields:newArr});

  };


  /**
     * Get the list of existing roles for an account
     */
  async getDataFieldsList() {
      //const roles = await this.state.instance.methods.getElemRoles(address).call()
      var line = [];
      for (let i = 0; i < this.state.dataFields.length; i++) {
          line.push(
              <tr key={i}>
                  <td>{i}</td>
                  <td>{this.state.dataFields[i].value}</td>
                  <td><Button onClick={() => this.deleteDataField(i)} class="btn btn-danger">Delete</Button></td>
              </tr>)
      }
      this.setState({ "dataFieldsList": line });
      return line
  }


  addNewField = () => {

    var dataFields = this.state.dataFields;

    dataFields.push(        
      {
        type: "text",
        value: this.state.newDataField
      });

    this.getDataFieldsList();
    this.setState(
      {dataFields:dataFields},
      );
  };

  deleteDataField = (i) =>{

    var dataFields = this.state.dataFields;

    var updDataFields = []
    for(var j=0; j<dataFields.length; j++){
      if (j!= i){
        updDataFields.push(dataFields[j]);
      }
    }
    console.log(updDataFields);
    
    this.setState(
      {dataFields:updDataFields},
      );

      var line = [];
      for (let l = 0; l < updDataFields.length; l++) {
          line.push(
              <tr key={l}>
                  <td>{l}</td>
                  <td>{updDataFields[l].value}</td>
                  <td><Button onClick={() => this.deleteDataField(l)} class="btn btn-danger">Delete</Button></td>
              </tr>)
      }
      this.setState({ "dataFieldsList": line });
      return line

      //this.getDataFieldsList(); 
  } 

  ///// Render

  render() {
    const layout = cyto_style['layoutCose'];
    const style = cyto_style['style'];
    const stylesheet = node_style.concat(edge_style);
    

  
  
  
    return <>

      <Authentification status={this.getStatus} />
      <div>
        <Header />
        <LoadToBC ref={this.loadToBC} processID={this.state.processID} src={this.state.src}></LoadToBC>

        <Row>
              <SidebarModel />
             

              <div className="col-md-9 ml-sm-auto col-lg-10 px-md-4">
              

              <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 ">

              <Container>

            
                <div className='container'>
                  <h2>Creating [template {this.state.templateID}]</h2>

                  <div className="form-group">
                        <label className="is-required" for="role">Select projection type</label>
                        <select className="custom-select" name="view-selector" onChange={e => this.onChangeView(e)}>
                          <option value="g_to_p">Global view</option>
                          <option value="p_to_g">Public view</option>
                        </select>
                        <span className="form-text small text-muted" id="helpTextFile">
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
                      {this.state.web3 === null ? <div>Loading web3...</div> :
                  
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

                                <hr /><br />

                                <h4>Datafields</h4>

                                <table className='table' striped bordered hover>
                                  <thead>
                                      <tr key='header'>
                                          <th>#</th>
                                          <th>datafield</th>
                                          <th></th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      <tr key='add_df'>
                                          <td>new</td>
                                          <td><input type="input" class="form-control " onPaste={e => this.onChange(e)} name="newDataField" onChange={e => this.onChange(e)}></input></td>
                                          <td><Button onClick={() => this.addNewField()} class="btn btn-primary">{"  Add  "}</Button></td>
                                      </tr>

                                      {this.state.dataFieldsList}
                                  </tbody>
                              </table>
                              <hr /><br />
                              </Form>

                              <Button onClick={this.updActivity}>update activity</Button>

                            </Card.Text>

                          </Card.Body>
                        </Card>
                        }
                      </Col>
                    </Row>
                  </div>
                  <Button onClick={this.saveToLibrary}>Save to library</Button>


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
