import React from 'react';
import Header from './Header';
import { Button, Row, Col, Container } from 'react-bootstrap';

import { Nav } from "react-bootstrap";
import { Link } from 'react-router-dom';
import TableScrollbar from 'react-table-scrollbar';

import { Table } from 'react-bootstrap';
import '../style/boosted.min.css';
import axios from 'axios';

import ipfs from '../ipfs';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

import getWeb3 from "../getWeb3";
import PublicDCRManager from '../contracts/PublicDCRManager.json';
import AdminRoleManager from '../contracts/AdminRoleManager.json';

import ChangeModal from './ChangeModal';

import '../style/Dashboard.css'
import { Mail, ThumbsUp, ThumbsDown } from 'react-feather';
import { faCommentsDollar } from '@fortawesome/free-solid-svg-icons';


var ProcessDB = require('../projections/DCR_Projections.json');

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
      contract: null,

      source: { ID: '', type: '' },
      target: { ID: '', type: '' },

      SCHashes: [],
      roleMaps:[],
      reqWkf:'',
      output:''
    };
    this.connectToWeb3 = this.connectToWeb3.bind(this);
    
  }

  componentWillMount() {

    this.connectToWeb3();

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

      this.setState({ web3, accounts, contract: instance });


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
        roleMaps.push({'role':r, 'address':a});
      });
      this.setState({ roleMaps:roleMaps })

      var tree = [];
      const output='';
      var eventsList = [];
      instance.getPastEvents('RequestChange', {
        filter: { endorser: accounts[0] }, // Using an array means OR: e.g. 20 or 23
        fromBlock: 0,
        toBlock: 'latest'
      })
        .then(function (events) {
          eventsList = events;
          console.log(events); // same results as the optional callback above

          var numEvents = eventsList.length;

    
          for (var j = 1; j < numEvents; j++) { // TEMP >> set init to 0 afterwards!!
            var event = [];


            var initiator='';
            var endorser='';

            for (var l = 0; l < roleMaps.length; l++) {

              if(eventsList[j].returnValues.initiator.toUpperCase().includes(roleMaps[l].address.toUpperCase())){
                initiator=roleMaps[l].role;
              }
              if (eventsList[j].returnValues.endorser.toUpperCase().includes(roleMaps[l].address.toUpperCase())){
                endorser=roleMaps[l].role; 
              }

            }

            event.push(initiator);
            event.push(endorser);

            event.push(eventsList[j].returnValues.workflowHashes.split('|')[0]);
            event.push(eventsList[j].returnValues.workflowHashes.split('|')[1]);

            tree.push(event);    
          }    
    
        }).then(()=>{
          this.setState({
            'tree': tree,
            'numEvents': eventsList.length,
          });
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

                <div className="bg-green">
                  <Nav>
                    <TableScrollbar rows={8}>
                      <Table>
                      <thead class="cf">
            <tr>
              <th class="header" scope="col">Status</th>
              <th class="header hide-when-big" scope="col">From</th>
              <th class="header hide-when-small" scope="col">To</th>
              <th class="header" scope="col">Workflow Hashes</th>
              <th class="header" scope="col">Actions</th>
            </tr>
            </thead>

                        <tbody>

                          {this.state.tree.map((event, i) => {
                            return <tr key={i} title={event[0]}>
                              <td class="align-middle"><Mail color='orange'/></td>
                              <td className="align-middle">{event[0]}</td>
                              <td className="align-middle">{event[1]}</td>
                              <td ><pre>Current: {event[2]} </pre>
<pre>
                              New: {event[3]}</pre>
                              </td>
                              <td className="align-middle">
                              <ChangeModal currHash={event[2]} reqHash={event[3]} web3={this.state.web3} accounts={this.state.accounts} contract={this.state.contract}/>
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
