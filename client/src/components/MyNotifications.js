import React from 'react';
// import $ from 'jquery';
import Header from './Header';
import { Row, Col, Container } from 'react-bootstrap';

import { Nav } from "react-bootstrap";
import TableScrollbar from 'react-table-scrollbar';

import { Table } from 'react-bootstrap';
import '../style/boosted.min.css';
import 'reactjs-popup/dist/index.css';

import getWeb3 from "../getWeb3";
import PublicDCRManager from '../contracts/PublicDCRManager.json';
import AdminRoleManager from '../contracts/AdminRoleManager.json';

import ChangeModal from './ChangeModal';

import '../style/Dashboard.css'
import { Mail, XOctagon, Clock, Check } from 'react-feather';


/**
 * Welcome component
 */
class MyNotifications extends React.Component {
  constructor(props) {
    super(props);
    this.state = {

      roleLength: '',
      roles: [],
      tree: [],


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

      numProcesses: 0,

      web3: null,
      accounts: null,
      contractDCR: null,

      source: { ID: '', type: '' },
      target: { ID: '', type: '' },

      SCHashes: [],
      roleMaps: [],
      reqWkf: '',
      output: '',

      newEvEval: ''
    };
    this.connectToWeb3 = this.connectToWeb3.bind(this);
    this.reloadEvent = this.reloadEvent.bind(this);
  }

  componentWillMount() {

    this.connectToWeb3();

  }


  reloadEvent() {
    console.log('im new hehe');
    this.setState({ 'newEvEval': true });
  }
  /**
   * Lists all processes that live in the SC (based on hash computations) and their role projections, and stores it into the tree state variable
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

      this.setState({ web3, accounts, contractDCR: instance });


      const adminNetwork = AdminRoleManager.networks[networkId];
      const adminInstance = new web3.eth.Contract(
        AdminRoleManager.abi,
        adminNetwork && adminNetwork.address,
      );

      this.setState({ web3, accounts, contractRole: adminInstance });

      var roles = await adminInstance.methods.getRoles().call()

      var roleMaps = []
      var tmpRoles = []
      var tmpAddress = []
      roles.forEach(line => {
        var r = line.split('///')[0];
        var a = line.split('///')[1];
        tmpRoles.push(r);
        tmpAddress.push(a);
        roleMaps.push({ 'role': r, 'address': a });
      });
      this.setState({ roleMaps: roleMaps })

      var tree = [];
      var eventsList = [];

      var declinedEvents = [];
      var okEvents = [];
      var acceptedEvents = [];

      var events_tab = [];
      var curr_hashes = [];

      instance.getPastEvents('RequestChange', {
        fromBlock: 0,
        toBlock: 'latest'
      })
        .then(function (events) {

          events.forEach(res => {

            if (!curr_hashes.includes(res.returnValues.workflowHashes.split(',')[0])) {
              var myEvent = {}
              curr_hashes.push(res.returnValues.workflowHashes.split(',')[0]);
              myEvent = {
                'currHash': res.returnValues.workflowHashes.split(',')[0],
                'reqHash': res.returnValues.workflowHashes.split(',')[1],
                'status': [{
                  'event':res['event'],
                  'address': res.returnValues.initiator
                }],
                'initiator': res.returnValues.initiator,
                'endorser': res.returnValues.endorser
              };
              events_tab.push({ myEvent });
            }
          }
          )
        });

      console.log('number of events: '+events_tab.length);

      instance.getPastEvents("allEvents").then(function (events) {
        if(events.length>0){

          console.log('allEvents');

          events.forEach(res=>{
            if(res['event']==='AcceptChangeAll'){
              // var i= 0; 
              //while(events_tab[i]['currHash'])            
              //events_tab[]
              }
            }
          )
        }
      })

      console.log('\n');
      instance.getPastEvents('AcceptChangeAll', {
        //  filter: { endorser: accounts[0] }, // Using an array means OR: e.g. 20 or 23
        fromBlock: 0,
        toBlock: 'latest'
      })
        .then(function (events) {
          if(events.length>0){
            console.log('accepted events');
            for (var j = 0; j < events.length; j++) {
              acceptedEvents.push({
                'hash': events[j].returnValues.reqWkfHash.toUpperCase(),
              }
              );
            }  
          }
        });

      instance.getPastEvents('AcceptChange', {
        fromBlock: 0,
        toBlock: 'latest'
      })
        .then(function (events) {

          for (var j = 0; j < events.length; j++) {
            if (events[j].returnValues.endorser === accounts[0]) {
              okEvents.push({
                'hash': events[j].returnValues.reqWkfHash.toUpperCase(),
                'endorser': events[j].returnValues.endorser
              }
              );
            }
          }
        });

      instance.getPastEvents('DeclineChange', {
        fromBlock: 0,
        toBlock: 'latest'
      })
        .then(function (eventsList) {
          for (var j = 0; j < eventsList.length; j++) {

            console.log('declined: ', eventsList[j].returnValues.reqWkfHash.toUpperCase());
            declinedEvents.push(eventsList[j].returnValues.reqWkfHash.toUpperCase());
          }
        });

      instance.getPastEvents('RequestChange', {
        fromBlock: 0,
        toBlock: 'latest'
      })
        .then(function (eventsList) {

          console.log(('im at reqChange'));
          for (var j = 0; j < eventsList.length; j++) {
            console.log(('test one'));

            if ((eventsList[j].returnValues.initiator.toUpperCase() === accounts[0].toUpperCase())
              && (eventsList[j].returnValues.initiator.toUpperCase() !== eventsList[j].returnValues.endorser.toUpperCase())) {


              var event = [];

              var initiator = '';
              var endorser = '';

              for (var l = 0; l < roleMaps.length; l++) {

                if (eventsList[j].returnValues.initiator.toUpperCase().includes(roleMaps[l].address.toUpperCase())) {
                  initiator = roleMaps[l].role;
                }
                if (eventsList[j].returnValues.endorser.toUpperCase().includes(roleMaps[l].address.toUpperCase())) {
                  endorser = roleMaps[l].role;
                }
              }

              event.push('Me (' + initiator + ')');
              event.push(endorser);
              event.push(eventsList[j].returnValues.workflowHashes.split(',')[0]); //currHash
              event.push(eventsList[j].returnValues.workflowHashes.split(',')[1]); //reqHash

              var isfullyOk = false;
              for (var ind = 0; ind < acceptedEvents.length; ind++) {
                if (acceptedEvents[ind].hash === eventsList[j].returnValues.workflowHashes.split(',')[1].toUpperCase()) {
                  isfullyOk = true;
                  event.push('[Approved]');
                }
              }

              if (!isfullyOk) {
                console.log('couocu')
                if (declinedEvents.length !== 0){
                  console.log('at least one declined event');
                  if (declinedEvents.includes(eventsList[j].returnValues.workflowHashes.split(',')[1].toUpperCase())) {
                    event.push('[Declined]');
                  } 
                }
                else{
                  event.push('[Waiting for endorsers]');
                }

              }
              tree.push(event);

            }



            if ((((eventsList[j].returnValues.endorser.toUpperCase() === accounts[0].toUpperCase()))
              && (eventsList[j].returnValues.initiator.toUpperCase() !== eventsList[j].returnValues.endorser.toUpperCase()))) {
                
              event = [];
              initiator = '';
              endorser = '';
              for (l = 0; l < roleMaps.length; l++) {
                if (eventsList[j].returnValues.initiator.toUpperCase().includes(roleMaps[l].address.toUpperCase())) {
                  initiator = roleMaps[l].role;
                }
                if (eventsList[j].returnValues.endorser.toUpperCase().includes(roleMaps[l].address.toUpperCase())) {
                  endorser = roleMaps[l].role;
                }
              }

              event.push(initiator);
              event.push(endorser);
              event.push(eventsList[j].returnValues.workflowHashes.split(',')[0]); //currHash
              event.push(eventsList[j].returnValues.workflowHashes.split(',')[1]); //reqHash

              if (declinedEvents.length !== 0){
                if (declinedEvents.includes(eventsList[j].returnValues.workflowHashes.split(',')[1].toUpperCase())) {
                  event.push('[Declined]');
                } 
              }
              else if ((okEvents.length !== 0)) {
                isfullyOk = false;
                // check if elem belongs to the list of accepted events   
                for (ind = 0; ind < acceptedEvents.length; ind++) {
                  if (acceptedEvents[ind].hash === eventsList[j].returnValues.workflowHashes.split(',')[1].toUpperCase()) {
                    isfullyOk = true;
                    event.push('[Approved]');
                  }
                }

                // if not, check if already processed
                var isprocessed = false;
                if (!isfullyOk) {
                  for (var i = 0; i < okEvents.length; i++) {
                    if ((okEvents[i].hash === eventsList[j].returnValues.workflowHashes.split(',')[1].toUpperCase()) && (okEvents[i].endorser === accounts[0])) {
                      event.push('[Waiting for other endorsers]');
                      isprocessed = true;
                    }
                  }
                  if (!isprocessed) {
                    event.push('[Waiting for decision]');
                  }
                }
              }
              else { 
                event.push('[Waiting for decision]');

              }

              tree.push(event);

            }
          }
        }).then(() => {


          // clean tree
          var cleaned_tree = Array.from(new Set(tree.map(JSON.stringify)), JSON.parse);
        
          // save to state
          this.setState({
            'tree': cleaned_tree,
            'numEvents': eventsList.length,
          })
        })


    } catch (error) {
      console.error(error);
    }


  }


  render() {
    return <div>
      <Header />
      <Container fluid >
        <Row >
          <Col >
            <div className="bg-green pt-5 pb-3">

              <div className='container'>


                <div className="row align-items-center">

                  <div className="col-6 col-md-6 col-lg-4">
                    <h2>My notifications</h2>
                  </div>
                  <div className="col-6 col-md-6 col-lg-8">
                    <img src="Dossier_en_cours.png" alt="" id='resize-verysmall' className="img-fluid" loading="lazy" />
                  </div>
                </div>

                <h5>Change requests:</h5>
                <img id="loader" src="https://loading.io/spinners/double-ring/lg.double-ring-spinner.gif" alt=""/>
                <div className="bg-green">
                  <Nav>
                    <TableScrollbar rows={8}>
                      <Table>
                        <thead className="cf">
                          <tr>
                            <th className="header" scope="col">Status</th>
                            <th className="header hide-when-big" scope="col">From</th>
                            <th className="header hide-when-small" scope="col">To</th>
                            <th className="header" scope="col">Workflow Hashes</th>
                            <th className="header" scope="col">Actions</th>
                          </tr>
                        </thead>

                        <tbody>

                          {this.state.tree.map((event, i) => {
                            return <tr key={i} title={event[0]}>
                              <td title={event[4]} className="align-middle">
                                {event[4] === '[Declined]' ?
                                  <XOctagon color='red' /> : <></>}
                                {event[4] === '[Waiting for other endorsers]' ?
                                  <Clock color='blue' /> : <></>}
                                {event[4] === '[Waiting for decision]' ?
                                  <Mail color='orange' /> : <></>}
                                {event[4] === '[Approved]' ?
                                  <Check color='green' /> : <></>}
                              </td>
                              <td className="align-middle">{event[0]}</td>
                              <td className="align-middle">{event[1]}</td>
                              <td >
                                <pre>Current: {event[2]} </pre>
                                <pre>New: {event[3]}</pre>
                              </td>
                              <td className="align-middle">
                                <ChangeModal currHash={event[2]}
                                  reqHash={event[3]}
                                  web3={this.state.web3}
                                  accounts={this.state.accounts}
                                  contractDCR={this.state.contractDCR}
                                  status={event[4]}
                                />
                              </td>
                            </tr>
                          }
                          )
                          }
                        </tbody>

                      </Table>
                    </TableScrollbar>
                  </Nav>


                </div>
                <br />

              </div>
            </div>

          </Col>
        </Row>
      </Container>
    </div>;
  }
}

export default MyNotifications
