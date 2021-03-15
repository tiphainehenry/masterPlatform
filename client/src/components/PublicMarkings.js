import React from 'react';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import '../style/App.css';

import { Button } from 'react-bootstrap';

import PublicDCRManager from '../contracts/PublicDCRManager.json';
import getWeb3 from '../getWeb3';

var ProcessDB = require('../projections/DCR_Projections.json');

/**
 * Component loading and displaying the blockchain public markings (in the form [event_id,markings,dataHash(opt)])
 */
class PublicMarkings extends React.Component {


  constructor(props){
    super(props);
    this.state = {
                  taskData:[],
                  length:this.props.activityNames.length,

                  web3: null,
                  accounts: null,
                  contract: null, 
                  labels:[]
                };
    this.checkHash = this.checkHash.bind(this);
  }
  
  /**
   * optional function used to check the authenticity of a data set by the user (the hash is stored in the smart contract)
   */
  checkHash = async (ev) => {
    alert('Checking Hash');

    // check if BC node
    const { accounts, contract } = this.state;

    try{
        const hashesVector = await contract.methods.getHashes().call();
  
        var dataToCheck = ev.data;
        var taskTriggered = ev.task;
    
        // retrieve data hash with activity id       
        if(taskTriggered.charAt(0) =='e'){
          var lastChar = taskTriggered.charAt(taskTriggered.length-1);
  
          console.log(lastChar)
    
          var activities = []
          switch(lastChar){
            case 's':
              activities = this.props.activityNames["send"];
              break;
            case 'r':
              activities = this.props.activityNames["receive"];
              break;
            default:
              activities = this.props.activityNames["default"];
          }
        }
        else{
          activities = this.props.activityNames["default"];
        }
        const isElem = (element) => element.includes(taskTriggered);
        var activityId= activities.findIndex(isElem);

        // check hashes
        if(hashesVector[activityId]==this.state.web3.utils.fromAscii(dataToCheck)){
          window.alert('success, data has been authenticated.');
        }
        else{
          window.alert('data authentication failed. The hashes do not correspond')
        }
      }
      catch (err) {
        window.alert(err);  
        console.log("web3.eth.handleRevert =", this.state.web3.eth.handleRevert);
        this.setState({wkState:'Create Global Workflow OnChain'});
      }  
  }

  /**
  * updates labels to display choreography names instead of ids, and connects to web3.js via connectsToBC()
  */
  componentWillMount() {

    // update choreo names

      var labels = []
      for(var i=0; i< this.props.activityNames.length; i++){
        console.log(this.props.activityNames[i]);
  
        var name = this.props.activityNames[i];
  
        for(var j=0; j<Object.keys(ProcessDB[this.props.processID]['TextExtraction']['global']['events']).length; j++){
          
          var global_name_to_test = ProcessDB[this.props.processID]['TextExtraction']['global']['events'][j]['event'].split('[')[0];
          if (global_name_to_test === this.props.activityNames[i] ){
            name = ProcessDB[this.props.processID]['TextExtraction']['global']['events'][j]['event'].split('[')[1].split(' ')[0]+ ' (choreo)';
          }
        }
        labels.push(name);
  
      }
      this.setState( {'labels':labels});  
    // load bc markings
    this.connectsToBC()
  }


  /**
   * connects to web3.js
   */
  async connectsToBC() {

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


    } catch (error) {
        //alert(
        //  `Failed to load web3, accounts, or contract. Check console for details.`,
        //);
        console.error(error);
    };

//    <Col sm><Button value={this.props.execLogs.execLogs}
//    style= {{'fontSize': '10pt', 'fontWeight': 200, 'backgroundColor':'none','border':'none'}}  
//    onClick={() => this.checkHash(this.props.execLogs.execLogs)}>Check Data Value
//</Button></Col>

  }


  render(){
    return  <div>
              <Card style={{height:'90%','marginTop':'3vh'}}>
              <Card.Header as="p" style= {{color:'white', 'backgroundColor': '#a267c9', 'borderBottom':'white'}}>
                  Public projection instance marking vectors</Card.Header>
                <Card.Body >
                <Row  style= {{'fontSize': '10pt', 'fontWeight': 1000}} xs={1} md={3} >
                      <Col sm>Activity</Col>
                      <Col sm>Marking (incl, exec, pend)</Col>
                      <Col sm>Data Hash</Col>                  
                </Row>                  
                <hr  style={{
                        width: '95%', 
                        color: 'LightGrey',
                        backgroundColor: 'LightGrey',
                        height: .1,
                        borderColor : 'LightGrey'
                      }}/>

                  {Array.from({length:this.props.activityNames.length}, (x,i)=>
                  <div>
                      <Row  key={i} style= {{'fontSize': '10pt', 'fontWeight': 200}} xs={1} md={3} >
                      <Col sm>{this.state.labels[i]}</Col>
                      <Col sm>({this.props.incl[i]},{this.props.exec[i]},{this.props.pend[i]})</Col>
                      <Col sm>{this.props.dataHashes[i]}</Col>

                    </Row>                  
                                          <hr  style={{
                                            width: '95%', 
                                            color: 'LightGrey',
                                            backgroundColor: 'LightGrey',
                                            height: .1,
                                            borderColor : 'LightGrey'
                                          }}/>
                  </div>  
                  )}

                </Card.Body>
              </Card>
            </div>; 
  }
}

export default PublicMarkings
