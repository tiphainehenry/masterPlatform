import ReactDOM from "react-dom";
import React, { Component } from "react";
import {  Modal, Card, Button, Row, Col, Form, Container } from 'react-bootstrap';
import ModalDialog from 'react-bootstrap/ModalDialog'

import { Nav } from "react-bootstrap";
import { Link } from 'react-router-dom';
import TableScrollbar from 'react-table-scrollbar';

import { Table } from 'react-bootstrap';
import '../style/boosted.min.css';
import axios from 'axios';

import ipfs from '../ipfs';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import { Mail, ThumbsUp, ThumbsDown } from 'react-feather';

import getWeb3 from "../getWeb3";
import PublicDCRManager from '../contracts/PublicDCRManager.json';
import AdminRoleManager from '../contracts/AdminRoleManager.json';


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

var node_style = require('../style/nodeStyle.json');
var edge_style = require('../style/edgeStyle.json');
var cyto_style = require('../style/cytoStyle.json')['edit'];

/**
 * Welcome component
 */
class ChangeModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      close: false,
      reqWkf:'',
      currWkf:''
    };
    this.saveReqWkf = this.saveReqWkf.bind(this);
    this.saveCurrWkf = this.saveCurrWkf.bind(this);
    this.answer = this.answer.bind(this);
    this.accept = this.accept.bind(this);
    this.decline = this.decline.bind(this);
  }

  componentWillMount() {
    console.log(this.props.currHash);
    console.log(this.props.reqHash);

    try{
      this.saveCurrWkf(this.props.currHash);
      this.saveReqWkf(this.props.reqHash);  
    }
    catch(error){
      alert('[Could not load IPFS] Please check the VPN')
    }

  }

  async saveReqWkf(hash){
    try{

    await ipfs.files.cat(hash).then((output) =>
      {
        this.setState({reqWkf:JSON.parse(output)})
      } 
    );}
    catch(error){
      alert('[Could not load IPFS] Please check the VPN');
    }
  }

  async saveCurrWkf(hash){
    try{
    await ipfs.files.cat(hash).then((output) =>
      {
        this.setState({currWkf:JSON.parse(output)})
      } 
    );}
    catch(error){
      alert('[Could not load IPFS] Please check the VPN');
    }
  }


  async answer(rsp){

    console.log(rsp);
    try{
        this.props.contractDCR.methods.endorserRSP(this.props.currHash, this.props.reqHash, rsp).send({
          from: this.props.accounts[0]
        }, (error) => {
                  console.log(error);
        }); //storehash 
      }
    catch(error){
        alert(error);
    }
  }

  async decline(){
    this.answer(2); 
  }

  async accept(){
    this.answer(1); 
  }

  render() {
    const layout = cyto_style['layoutCose'];
    const style = cyto_style['style'];
    const stylesheet = node_style.concat(edge_style);

    return <div>

      {this.props.status == '[Waiting for decision]'? 
    <Button onClick={() => this.setState({ show: true })} title='Click me'>
      Compare and Decide
    </Button>    
    :
    <Button disabled onClick={() => this.setState({ show: true })} title='Request has been processed'>
      Compare and Decide
    </Button>

    }

      <Modal show={this.state.show} animation={true} >
        <Modal.Header >
          <Modal.Title >
              <h2>My notifications</h2>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{'padding':0,'margin':0}}>
      <Container fluid >
        <Row >
          <div class="col-md-6 ml-auto">
          <p>Before</p>
          
                            <CytoscapeComponent elements={this.state.currWkf}
                              stylesheet={stylesheet}
                              layout={layout}
                              style={style}
                              cy={(cy) => { this.cy = cy }}
                              boxSelectionEnabled={true}
                            />
                  </div>

                  <div class="col-md-6 ml-auto">
                  <p>After</p>

                            <CytoscapeComponent elements={this.state.reqWkf}
                              stylesheet={stylesheet}
                              layout={layout}
                              style={style}
                              cy={(cy) => { this.cy = cy }}
                              boxSelectionEnabled={true}
                            />
                  </div>
        </Row>
        <hr/>
        <Row >
          <Col class="col-md-6 ml-auto"  className="text-center">
        <Button  variant="outline-success" onClick={this.accept}><ThumbsUp/> Accept</Button>
        </Col>
        <Col class="col-md-6 ml-auto"  className="text-center">
        <Button  variant="outline-danger" onClick={this.decline}><ThumbsDown/> Decline </Button>
</Col>
</Row>
      </Container>

        </Modal.Body>
        <Modal.Footer className="py-1 d-flex justify-content-center">
          <div>
            <Button variant="outline-dark" onClick={() => this.setState({ show: false })}>
              Ok
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>;
  }
}

export default ChangeModal
