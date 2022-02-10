import React from 'react';
import '../style/App.css'
import Authentification from './Authentification'
import dcrHelpers from './utils_dcrHelpers';
import Header from './Header';

import { Card, Row, Col, Container } from 'react-bootstrap';
import SidebarModel from './SidebarModel';
import LoadToBC from './LoadToBC';

import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';

import axios from 'axios';
import COSEBilkent from 'cytoscape-cose-bilkent';
import Dagre from 'cytoscape-dagre'
import Klay from 'cytoscape-klay'

import AdminRoleManager from '../contracts/AdminRoleManager.json';
import getWeb3 from '../getWeb3';
import ipfs from '../ipfs';

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
class LoadInstance extends React.Component {

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

      processName: this.props.match.params.pid,
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

      roles:[],

      rolesWithAddresses:[],
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

    this.cmpAccountRoles = dcrHelpers.cmpAccountRoles.bind(this);

    this.fileUpload = this.fileUpload.bind(this);
    this.postLibrary = this.postLibrary.bind(this);

    this.createFile = this.createFile.bind(this);
    this.instantiate= this.instantiate.bind(this);

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onIPFSSubmit = this.onIPFSSubmit.bind(this);
    this.onChangeView = this.onChangeView.bind(this);

    this.getProperName = this.getProperName.bind(this);

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
    this.cy.remove('nodes');
    this.getTemplate();

  };

  /**
   * Instantiates component with the right process and projection view.
   */
  componentWillMount() {

    this.getRoles().then(res=> 
      {
        var roleOptions = [];

        this.state.roles.forEach((r)=>{
          var newOption = {'value':r, 'label':r};
          roleOptions.push(newOption);
        })
        this.setState({'roleOptions':roleOptions});
      }
);

  };

  getStatus = auth => this.setState({ auth })

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

            // fetch participants addresses
            const participantsData = await instance.methods.getRoles().call()
            var addresses = []
            console.log("ADDRESSES");
            console.log(participantsData);
            participantsData.forEach(line => {
                var val = line.split('///')[1];     
                if(val.slice(0,2)!='0x'){
                  val = '0x'+val;
                }              
                addresses.push(val);
            });
      
      
      // fetch list of roles registered per address
      var roles = [];
      var rolesWithAddresses=[];
      for(var i=0; i<addresses.length; i++){
          const addressRoles = await instance.methods.getElemRoles(addresses[i]).call();
          for(var j=0; j<addressRoles.length; j++){
              if(!roles.includes(addressRoles[j])){
                  roles.push(addressRoles[j]);  
                  rolesWithAddresses.push({'role':addressRoles[j], 'address':addresses[i]})          
              }
          }
      }

      console.log(addresses);
      console.log(roles);
      console.log(rolesWithAddresses);

      this.setState({
          roles:roles,
          addresses:addresses,
          rolesWithAddresses:rolesWithAddresses
      })
      
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

    alert(this.state.processID);

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


  ////////  CALL API    ////////
  /**
   * Instantiate the process in the BC
   * 
   */
  fileUpload(file) {

    const url = `http://localhost:5000/inputFile`;


    var processNum = Object.keys(ProcessDB).length + 1;
    var processID = 'p' + processNum;

    this.setState({
      processID: processID
    }, () => {
      localStorage.setItem('processID', JSON.stringify(this.state.processID))
    });

    const formData = new FormData();

    formData.append('file', file);
    formData.append('processID', processID);
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

    axios.post(`http://localhost:5000/library`, { "data": data, "processID": this.state.templateID }, config).then(
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


  getProperName(id_to_test){
    var properName = 'null';

    this.cy.elements().forEach(function (ele, id) {
      if (ele['_private']['group'] === "nodes") {
        if(ele['_private']['data']['id'].replace(' ','')== id_to_test.replace(' ','')){
          if (ele['_private']['data']['name'].split(' ').length ==2){
            //private event
            properName = ele['_private']['data']['name'].split(' ')[1].replace(' ',''); 
          }
          else{
            //choreography
            properName = ele['_private']['data']['name'].replace(' ',''); 

          }
        }
      }
    })
    return properName;  
  }


  fetchRoleAddress(r){
    const addressRole='';

    console.log(this.state.rolesWithAddresses)

    var i=0;
    for(var i=0; i<this.state.rolesWithAddresses; i++){
      if(this.state.rolesWithAddresses[i]['role']===r){
        addressRole=this.state.rolesWithAddresses[i]['address'];
      }

    }

    console.log(addressRole);
    return addressRole;
  }
  /**
     * Create an input File to send to the API
     * 
     */
  createFile() {
    //e.preventDefault() // Stop form submit

    var newData = [];
    var publicData=[];

    // retrieve data
    var rolelist = new Map()
    this.cy.elements().forEach(function (ele, id) {
      //console.log(ele)
      //console.log("id = " + id);
      var newEle = {};
      var tmp='';

      if (ele['_private']['group'] === "nodes") {

        console.log(ele['_private']['classes']);
        if (ele['_private']['classes'].has("choreography")||ele['_private']['classes'].has("type_choreography")) {
          id++;
          tmp = ele['_private']['data']['name'].split(' ');
          tmp = tmp.filter(e => e !== "");
          rolelist.set(tmp[0], this.state.addresses[this.state.roles.indexOf(tmp[0])]);


          var receivers="";
          var tgts=tmp[2].split(",");
          if(tgts.length>1){
            for (var ind=0; ind<tgts.length;ind++){
              receivers=receivers+" tgt=" + tgts[ind];
              rolelist.set(tgts[ind], this.state.addresses[this.state.roles.indexOf(tgts[ind])]);
            }
          }
          else{
            console.log('here:'+tmp[2]);
            receivers=" tgt=" + tmp[2];
            console.log(this.state.roles);
            console.log(this.state.roles.indexOf(tmp[2]));
            console.log(this.state.addresses.length);

            if(typeof this.state.addresses[this.state.roles.indexOf(tmp[2])]==='undefined'){
              console.log('undefined');
              var addressRole='';

              console.log(this.state.rolesWithAddresses)
          
              var i=0;
              console.log(this.state.rolesWithAddresses);
              for(var i=0; i<this.state.rolesWithAddresses; i++){
                console.log(this.state.rolesWithAddresses[i]['role']);
                console.log(tmp[2]);
                console.log('______________')
                if(this.state.rolesWithAddresses[i]['role']===tmp[2]){
                  addressRole=this.state.rolesWithAddresses[i]['address'];
                }
          
              }
              
              rolelist.set(tmp[2], addressRole);
            
            }
            else{
              rolelist.set(tmp[2], this.state.addresses[this.state.roles.indexOf(tmp[2])]);

            }

          }

          var eventID = "e" + id;
          newEle = {
            "name": eventID + "[" + tmp[1] + " src=" + tmp[0] + receivers+ "]\n"
          }
          ele['_private']['data']['name'] = eventID;

          publicData.push({
            "in": ele['_private']['data']['dataFields'],
            "eventID": eventID
          });
          
        } else {

          tmp = ele['_private']['data']['name'].split(' ');
          rolelist.set(tmp[0], this.state.addresses[this.state.roles.indexOf(tmp[0])]);
          newEle = {
            "name": tmp[1] + "[role=" + tmp[0] + "]\n",
          };
        }
      } else if (ele['_private']['group'] === "edges") {
          var srcID = ele['_private']['data']['source'].replace(' ','');
          var tgtID = ele['_private']['data']['target'].replace(' ','');

          var src = this.getProperName(srcID);
          var tgt = this.getProperName(tgtID);

          var link = this.state.edges[ele['_private']['classes'].values().next().value];
          newEle = { "link": src + link + tgt + '\n' }
      }
        newData.push(newEle);
    }.bind(this));

    console.log('rolelist');
    console.log(rolelist);

    var arrayEvent = [];
    var arrayLink = [];

    try{
      console.log(publicData);
      for(var i=0; i<publicData.length; i++){
        console.log(publicData[i]);
  
        var input_dataFields = "[type="+publicData[i]['in'][0]['type']+',value='+publicData[i]['in'][0]['value'];
        for(var j=1; j<publicData[i]['in'].length; j++){
          console.log(publicData[i]['in'][0]);
          input_dataFields=input_dataFields+";[type="+publicData[i]['in'][j]['type']+',value='+publicData[i]['in'][j]['value'];
        }
        var publicDataDescription = 'publicData[eID='+publicData[i]['eventID']+';in='+input_dataFields+']]';
        arrayEvent.push(publicDataDescription);
      }  
    }
    catch{
      console.log('error');
    }

    const it = rolelist.keys();
    for (const key of it) {
      console.log(key);
      var tmp_add = rolelist.get(key);
      console.log("init:"+tmp_add);
      if(tmp_add.slice(0,2)!='0x'){
        tmp_add='0x'+tmp_add;
      }
      console.log("processed:"+key+'>'+tmp_add);

      arrayEvent.push("pk[role=" + key + "]=" +tmp_add +'\n');
    }
    newData.forEach(line => {
      if (line.hasOwnProperty('name'))
        arrayEvent.push(line['name']+'\n')
      else
        arrayLink.push(line['link']+'\n')
    })
    const data = arrayEvent.concat(arrayLink);

    console.log('/// data ///')
    data.forEach(line=> console.log(line));

    const file = new File(data, 'creationDeck.txt', { type: "text/plain" });

    this.fileUpload(file).then((response) => {
      alert(response.data);
      if (response.data === "ok") {
        console.log('projection done');
      }
      else{
        console.log('projection failed');
      }
    })

    //return (new File(newdata, 'creationDeck.txt', { type: "text/plain" }))
  }

  async instantiate(){
    this.loadToBC.current.handleCreateWkf();
    console.log("is ok loadtoBC");
  }


  /**
  * Save a graph as a template and send it to the API
  * 
  */
  onFormSubmit() {
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
                  <h2>Instantiate process from template [{this.state.templateID}]</h2>
                  <Row>
                  <Col>
                      <Card style={{ height: '95%'}}>
                          <Card.Body >
                            <CytoscapeComponent
                              stylesheet={stylesheet}
                              layout={layout}
                              style={style}
                              cy={(cy) => { this.cy = cy }}
                              boxSelectionEnabled={false}
                            />
                          </Card.Body>
                      </Card>
                  </Col>
                  <Col>
                  <div className="row">
                  <div className="col-sm-6">
                    <form id="myForm">
                      <div className="form-group">
                        <label className="is-required" htmlFor="role">Select projection type</label>
                        <select className="custom-select" name="view-selector" onChange={e => this.onChangeView(e)}>
                          <option value="g_to_p">Global view</option>
                          <option value="p_to_g">Public view</option>
                        </select>
                        <span className="form-text small text-muted" id="helpTextFile">
                          Global view: declare all tasks (public+private).
                          Public view: declare ONLY the public tasks of the participants.  
                        </span>
                      </div>

                      <div className="form-group my-3">
                        <button className="btn btn-secondary" onClick={this.createFile}>1. Project</button>
                      </div>

                      <div className="form-group my-3" >
                        <button className="btn btn-secondary" onClick={this.onIPFSSubmit}>2. Save public text extraction to IPFS</button>
                      </div>

                      <LoadToBCL ref={this.loadToBC} ipfsHash={this.state.ipfsHash} processID={this.state.processID} stage="templateInstance"/>

                    </form>
                  </div>
                </div>

                </Col>

                </Row>
        
                  
                </div>
                </Container>
              </div>
              </div>

             </Row>

      </div>
    </>

  }
}

export default LoadInstance
