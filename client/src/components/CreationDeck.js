import React, { useState } from 'react';

import activityUpdHelpers from './utils_ActivityUpdHelpers';
import cytoMenuHelpers from './utils_CytoMenuHelpers';
import { getMenuStyle } from './utils_ContextMenuHelpers';

import Header from './Header';

import { Card, Button, Row, Col, Form, Container } from 'react-bootstrap';
import SidebarModel from './SidebarModel';
import LoadToBC from './LoadToBC';

import Cytoscape from 'cytoscape';
import CytoscapeComponent from 'react-cytoscapejs';

import contextMenus from 'cytoscape-context-menus';
import 'cytoscape-context-menus/cytoscape-context-menus.css';

import axios from 'axios';
import COSEBilkent from 'cytoscape-cose-bilkent';
import Dagre from 'cytoscape-dagre'
import Klay from 'cytoscape-klay'

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
    this.state = {
      data: {},
      processID: 'p2',
      processName: this.props.location.state['currentProcess'][1],
      projectionID: 'Global',
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
      target: { ID: '', type: '' }
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

    this.privateGraphUpd = this.privateGraphUpd.bind(this);

  }

  /**
   * Setting up the environment:
   * - Fits the graph display to the window, 
   * - Activates the editing menu, and sets up click listeners,
   * - Updates the total number of new activities to keep the counter updated for second changes.
   */
  componentDidMount = async () => {
    console.log(this.cy)
    this.cy.fit();
    this.cy.remove('nodes')
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
      newActivityCnt: newActivityCnt
    });

  };

  /**
   * Instanciates component with the right process and projection view.
   */
  componentWillMount() {

    var processID = this.state.processID;
    var projectionID = this.state.projectionID;

    console.log(this.props.location);
    if (typeof (this.props.location.state) !== 'undefined') {
      if (typeof (this.props.location.state['currentProcess'][1]) !== 'undefined') {
        processID = this.props.location.state['currentProcess'][1];
        var projectionID = this.props.location.state['currentInstance'];

        this.setState({
          'processID': processID,
          'processName': this.props.location.state['currentProcess'][1],
          'projectionID': projectionID,
          'data': {}
        });
      }
    }
  };

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
          var type = 'subgraph';
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
        if (event.target['_private']['data']['id'] === this.state.source.ID) {
          this.setState({ source: { ID: "", type: "" }, numSelected: 0 })
        } else {
          this.setState({ target: { ID: "", type: "" }, numSelected: 1 })
        }
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

    if (window.confirm('Confirm new graph version?')) {

      var newData = [];

      // retrieve data 
      this.cy.elements().forEach(function (ele, id) {
        console.log(ele)
        var newEle = {}
        if (ele['_private']['group'] === "nodes") {
          if (ele['_private']['classes'].has("choreography")) {
            var tmp = ele['_private']['data']['name'].split(' ')
            newEle = {
              "name": "e" + id++ + "[" + tmp[1] + " src=" + tmp[0] + " trg=" + tmp[2] + "]"
            }
          } else {

            var tmp = ele['_private']['data']['name'].split('\n')
            newEle = {
              "name": tmp[0] + " [role=" + tmp[1] + "]",
            };
          }
        } else if (ele['_private']['group'] === "edges") {
          console.log("edges");
          var src = ele['_private']['data']['source']
          var trg = ele['_private']['data']['target']
          var link = this.state.edges[ele['_private']['classes'].values().next().value]
          newEle = { "link": src + link + trg }
        }
        newData.push(newEle);
      }.bind(this));
      this.fileUpload(this.createFile(newData))
    }
    else {
      console.log('save aborted');
    }
  }

  createFile(data) {
    var arrayEvent = []
    var arrayLink = []

    data.forEach(line => {
      if (line.hasOwnProperty('name')) 
        arrayEvent.push(line['name'])
      else
        arrayLink.push(line['link'])
    })
    const newdata = arrayEvent.concat(arrayLink)
    return (new File(newdata, 'creationDeck.txt', { type: "text/plain" }))
  }

  fileUpload(file) {
    const url = `http://localhost:5000/inputFile`;

    var processNum = Object.keys(ProcessDB).length + 2;
    var processID = 'p' + processNum;

    this.setState({ processID: processID });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('processID', processID);
    for (var k of formData.values()) {
      console.log(k)
    }

    axios.post(`http://localhost:5000/inputFile`).then(
      (response) => {
        var result = response.data;
        console.log(result);
      },
      (error) => {
        console.log(error);
      }
    );
  }
  ///// Render

  render() {
    const layout = cyto_style['layoutCose'];
    const style = cyto_style['style'];
    const stylesheet = node_style.concat(edge_style);
    console.log("state");
    console.log(this.state);
    return <>
      <div>
        <Header />
        <Container fluid >
          <Row>
            <LoadToBC></LoadToBC>
          </Row>
          <Row >
            <Col sm={2} style={{ 'padding-left': 0, 'padding-right': 0 }}>
              <SidebarModel />
            </Col>
            <Col style={{ 'padding-left': 0, 'padding-right': 0 }}>
              <div class="bg-green pt-5 pb-3">

                <div class='container'>
                  <h2>Creating [process {this.state.processID}]</h2>

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

                                <h4>Tenants</h4>

                                <Form.Label>Private Role</Form.Label>
                                <Form.Control type="address" onChange={this.handleTenant} placeholder={'enter tenant name'} value={this.state.tenantName} />

                                <br />

                                <Form.Label>Choreography Sender </Form.Label>
                                <Form.Control type="address" onChange={this.handleSender} placeholder={'enter sender name'} value={this.state.choreographyNames.sender} />
                                <br />
                                <Form.Label>Choreography Receiver</Form.Label>
                                <Form.Control type="address" onChange={this.handleReceiver} placeholder={'enter receiver name'} value={this.state.choreographyNames.receiver} />

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
                  <Button onClick={this.privateGraphUpd}>save new version</Button>

                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>

  }
}

export default CreationDeck
