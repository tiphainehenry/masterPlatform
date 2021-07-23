import React from 'react';

import activityUpdHelpers from './utils_ActivityUpdHelpers';
import cytoMenuHelpers from './utils_CytoMenuHelpers';
import changeManager from './utils_ChangeManager';

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



var ProcessDB = require('../projections/DCR_Projections.json');

/**
 * Template component to edit a projection
 */
class TemplateDeck extends React.Component {

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
      publicHash:'',

      chgStatus:'loading',
      test:'loading', 
      chgEndorsement:'loading',

      WKFValue:'',

      roleLoading:'loading'

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

  }

  
  render() {
    return <>
        <Card bg={'light'} style={{ 'marginTop': '3vh', width: '100%' }}>
                          <Card.Body>
                            <Card.Title><h3>Editor Deck</h3></Card.Title>
                            <hr /><br />

                            <Card.Text>
                              <Form>
                                <h4>Activity</h4>

                                <Form.Label>Activity name</Form.Label>
                                <Form.Control type="address" onChange={this.handleActivityName} placeholder={'enter activity name'} value={this.props.elemClicked.activityName} />

                                <hr style={{ "size": "5px" }} /><br />
                                <h4>Assign role</h4>
                                <div className="form-group">
                                  <label className="is-required" for="role">Private role</label>
                                  <select className="custom-select" name="view-selector" onChange={this.handleTenant} placeholder={"Tenant"} value={this.props.tenantName} >
                                  <option value=''> --- </option>          
                                  {
                                    React.Children.toArray(
                                      this.props.roles.map((name, i) => <option key={i}>{name}</option>)
                                    )
                                  }
                                  </select>
                                </div>
                                <br />

                                <div className="form-group">
                                  <label className="is-required" for="role">Choreography Sender</label>
                                  <select className="custom-select" name="view-selector" onChange={this.props.handleSender} placeholder={"Sender"} value={this.props.choreographyNames.sender}>
                                  <option value=''> ---</option>
                                  
                                  {
                                    React.Children.toArray(
                                      this.props.roles.map((name, i) => <option key={i}>{name}</option>)
                                    )
                                  }

                                  </select>
                                </div>

                                <Button id="switch-btn" onClick={() => this.switchDest()} ><FontAwesomeIcon icon={faExchangeAlt} /></Button>
                                <br />
                                <div className="form-group">
                                  <label className="is-required" for="role">Choreography Receiver</label>
                                  <select className="custom-select" name="view-selector" onChange={this.handleReceiver} placeholder={"Receiver"} value={this.props.choreographyNames.receiver}>
                                  <option value=''> ---</option>
                                  {
                                    React.Children.toArray(
                                      this.props.roles.map((name, i) => <option key={i}>{name}</option>)
                                    )
                                  }
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
    </>

  }
}

export default TemplateDeck
