import React from 'react';
import {ListGroup,Form, Button, Row, Col, Container } from 'react-bootstrap';

import { post } from 'axios';
import ipfs from '../ipfs';
import getWeb3 from "../getWeb3";

import PublicDCRManager from '../contracts/PublicDCRManager.json';


import '../style/boosted.min.css';
import Header from './Header';
import LoadToBCL from './LoadToBCL';
import SidebarModel from './SidebarModel';

var ProcessDB = require('../projections/DCR_Projections.json');

/**
 * Component to generate a new process instance out of a dcr input file.
 */
class CreateG extends React.Component {
  constructor(props) {
    super(props);
    this.loadToBC = React.createRef()
    this.state = {
      ipfsHash: null,
      buffer: '',
      ethAddress: '',
      blockNumber: '',
      transactionHash: '',
      gasUsed: '',
      txReceipt: '',
      web3: null,
      accounts: null,
      contract: null,

      file: null, 
      processID: JSON.parse(localStorage.getItem('processID')) || '',
    };
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.fileUploadG = this.fileUploadG.bind(this);
    this.connectToWeb3 = this.connectToWeb3.bind(this);
    this.onIPFSSubmit = this.onIPFSSubmit.bind(this);

  }


  componentWillMount() {
    this.connectToWeb3();
  }

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

      // Checking if contract already populated
      this.setState({ wkState: 'Create Global Workflow OnChain.' })

    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. 
          Check console for details.
          Tip: Webpage should be connected to the Ropsten network via Metamask (https://metamask.io/).`,
      );
      console.error(error);
    };
  }

  onIPFSSubmit = async (event) => {
    event.preventDefault();

    console.log('Sending from Metamask account: ' + this.state.accounts[0]);

    //obtain contract address from storehash.js
    const ethAddress = await this.state.contract.options.address;
    this.setState({ ethAddress });

    //save document to IPFS,return its hash#, and set hash# to state
    //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#add 

    var input = ProcessDB[this.state.processID]['TextExtraction']['public'];
    ipfs.files.add(Buffer.from(JSON.stringify(input)))
      .then(res => {
      const hash = res[0].hash
      //console.log('added data hash:', hash)
      this.setState({ ipfsHash: hash });

      //this.state.contract.methods.sendHash(this.state.ipfsHash).send({
      //  from: this.state.accounts[0]
      //}, (error, transactionHash) => {
      //  console.log('onIPFSSubmit error');
      //  console.log(transactionHash);
      //  this.setState({ transactionHash });
      //}); //storehash 
    
      return ipfs.files.cat(hash)
    })
    .then(output => {
      console.log('retrieved data:', JSON.parse(output))
    })

  }; //onIPFSSubmit 


  /**
   * updates filepath on new upload.
   * @param e upload event
   */
  onChange(e) {
    this.setState({ file: e.target.files[0] })
  }

  /**
   * upload filename and process it into the backend to generate projections.
   * @param file dcr textual representation (see examples in the DCRinput folder).
   */
  fileUploadG(e,file) {
    e.preventDefault();

    const url = `http://localhost:5000/inputFile`;
    console.log(url);
    var processNum = Object.keys(ProcessDB).length + 1;
    var processID = 'p' + processNum;

    this.setState({
      processID: processID
    },() => {
      localStorage.setItem('processID', JSON.stringify(this.state.processID))
    });


    const formData = new FormData();
    formData.append('file', file);
    formData.append('processID', processID);
    formData.append('projType', 'g_to_p');

    const config = {
      headers: {
        'content-type': 'multipart/form-data',
        'Access-Control-Allow-Origin': '*',
      }
    };

    return post(url, formData, config)
  }

  /**
   * uploads file on user click.
   * @param e click event
   */
  onFormSubmit(e) {
    e.preventDefault(); // Stop form submit

    this.fileUploadG(e,this.state.file).then((response) => {
      console.log(response.data);
      if (response.data === "ok") {
        console.log('projection done');
      }
    })
  }

  render() {
    return <div>
      <Header />
      <Container fluid >
        <Row >
          <Col sm={2} style={{ 'padding-left': 0, 'padding-right': 0 }}>
            <SidebarModel />
          </Col>
          <Col style={{ 'padding-left': 0, 'padding-right': 0 }}>
            <div class="bg-green pt-5 pb-3">
              <div class="container">
                <h2>My Process Models - Global input to local projections.</h2> 
                <h3>Import and project a new process model</h3>
                <h5>Step 1 </h5>

                <p>Load a GLOBAL DCR file to be projected (i.e. a process that declares both the private and public tasks of the participants.) The three input files used for our experiments are accessible in the <a href='https://github.com/tiphainehenry/react-cyto/'>dcrInputs repository</a> of our github.</p>

                <Container>
                  <hr />
    
                  <form onSubmit={this.onFormSubmit}>
                    <input type="file" onChange={this.onChange} />
                    <button class="btn btn-primary my-2 my-sm-0" type="submit">0./ Bit-vectorize the public view</button>
                  </form>

                  <hr />
    
                  <Form onSubmit={this.onIPFSSubmit}>
                    <Button
                      bsStyle="primary"
                      type="submit">
                      1./ Store public text extraction to IPFS
                    </Button>
                  </Form>
                  <hr/>
                  <LoadToBCL ref={this.loadToBC} ipfsHash={this.state.ipfsHash}/>

                </Container>
                <hr />
                <h5>Step 2</h5>
                <p>To execute the process, navigate between the different role projections accessible via the 'My running instances' header. </p>
                <p>
                  Each graph comprises four types of events. </p>
                <ListGroup>
                  <ul>(1) Send choreography events are marked with (!)</ul>
                  <ul>(2) Receive choreography events are marked with (?)</ul>
                  <ul>(3) Internal events comprise the event name only.</ul>
                  <ul>(4) External events (choreography or internal) are filled in black.</ul>
                </ListGroup>

                <p>
                  The local projected excluded events are filled in grey, while the local events included and/or executed are filled in white.
                </p>
                <p>
                  The five DCR relations are depicted: include in green, exclude in red, milestone in violet, condition in orange, and response in blue.
                </p>

                <p>
                  Concerning the process execution, (i) the local events that do not have any interaction with other private projections
                  are executed off-chain, (ii) choreography events and external events are executed in the Ethereum BC through REST API calls.
                  Each projection holds a marking with both internal and external event states. These are set to one if the event is activated, and null otherwise.
                        </p>

                      <Button href="/welcomeInstance"> Access the instances</Button>
                <hr />


              </div>
            </div>
          </Col>
        </Row>
      </Container>

    </div>


      ;
  }
}

export default CreateG