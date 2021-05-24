import React from 'react';

import {Table, Button, Form, ListGroup,Row, Col, Container } from 'react-bootstrap';

import '../style/boosted.min.css';
import Header from './Header';
import { post } from 'axios';
import LoadToBC from './LoadToBC';
import SidebarModel from './SidebarModel';

import PublicDCRManager from '../contracts/PublicDCRManager.json';
import ipfs from '../ipfs';

import getWeb3 from "../getWeb3";

var ProcessDB = require('../projections/DCR_Projections.json');

/**
 * Component to generate a new process instance out of a dcr input file.
 */
class CreateL extends React.Component {
  constructor(props) {
    super(props);
    this.loadToBC = React.createRef()
    this.state = {
      file: null, 
      processID:'',

      ipfsHash:null,
      buffer:'',
      ethAddress:'',
      blockNumber:'',
      transactionHash:'',
      gasUsed:'',
      txReceipt: '',
      web3: null,
      accounts: null,
      contract: null,

    };
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.fileUpload = this.fileUpload.bind(this);
    this.connectToWeb3 = this.connectToWeb3.bind(this);
    this.captureFile = this.captureFile.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
    this.convertToBuffer = this.convertToBuffer.bind(this);
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

  captureFile =(event) => {
    event.stopPropagation()
    event.preventDefault()
    const file = event.target.files[0]
    let reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => this.convertToBuffer(reader)    
  };

  convertToBuffer = async(reader) => {
    //file is converted to a buffer to prepare for uploading to IPFS
      const buffer = await Buffer.from(reader.result);
    //set this buffer -using es6 syntax
      this.setState({buffer});
      alert('i am buffer');
  };


  onClick = async () => {

    try{
        this.setState({blockNumber:"waiting.."});
        this.setState({gasUsed:"waiting..."});

        // get Transaction Receipt in console on click
        // See: https://web3js.readthedocs.io/en/1.0/web3-eth.html#gettransactionreceipt
        await this.state.web3.eth.getTransactionReceipt(this.state.transactionHash, (err, txReceipt)=>{
          console.log(err,txReceipt);
          this.setState({txReceipt});
          console.log('tx receip null');
        }); //await for getTransactionReceipt

        await this.setState({blockNumber: this.state.txReceipt.blockNumber});
        await this.setState({gasUsed: this.state.txReceipt.gasUsed});    
      } //try
    catch(error){
        console.log('onclick error');

        console.log(error);
      } //catch
  } //onClick

  onSubmit = async (event) => {
    event.preventDefault();

    console.log('Sending from Metamask account: ' + this.state.accounts[0]);

    //obtain contract address from storehash.js
    const ethAddress= await this.state.contract.options.address;
    this.setState({ethAddress});

    //save document to IPFS,return its hash#, and set hash# to state
    //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#add 
    await ipfs.add(this.state.buffer, (err, ipfsHash) => {
      console.log(err,ipfsHash);
      //setState by setting ipfsHash to ipfsHash[0].hash 
      this.setState({ ipfsHash:ipfsHash[0].hash });

      // call Ethereum contract method "sendHash" and .send IPFS hash to etheruem contract 
      //return the transaction hash from the ethereum contract
      //see, this https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send
      
      this.state.contract.methods.sendHash(this.state.ipfsHash).send({
        from: this.state.accounts[0] 
      }, (error, transactionHash) => {
        console.log('onSubmit error');
        console.log(transactionHash);
        this.setState({transactionHash});
      }); //storehash 
    }) //await ipfs.add 
  }; //onSubmit 

  /**
   * uploads file on user click.
   * @param e click event
   */
  onFormSubmit(e) {
    e.preventDefault() // Stop form submit
    this.fileUpload(this.state.file).then((response) => {
      console.log(response.data);
      if (response.data === "ok") {
        this.loadToBC.current.handleCreateWkf()
      }
    })
  }

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
  fileUpload(file) {
    const url = `http://localhost:5000/inputFile`;

    var processNum = Object.keys(ProcessDB).length +1;
    var processID = 'p'+ processNum;
    
    this.setState({processID: processID});
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('processID', processID);
    formData.append('projType', 'p_to_g');

    const config = {
      headers: {
        'content-type': 'multipart/form-data',
        'Access-Control-Allow-Origin': '*',
      }
    };

    return post(url, formData, config)
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
              <h2>My Process Models - Public input and incremental projections.</h2> 
                <h3>Import and project a new process model</h3>
                <h5>Step 1 </h5>

                <p>Load a PUBLIC DCR file to be projected (i.e. a process that declares ONLY the public tasks of the participants.) The three input files used for our experiments are accessible in the <a href='https://github.com/tiphainehenry/react-cyto/'>dcrInputs repository</a> of our github.</p>
                <form onSubmit={this.onFormSubmit}>
                  <input type="file" onChange={this.onChange} />
                  <button class="btn btn-primary my-2 my-sm-0" type="submit">Upload and project</button>
                </form>
                <hr />
                <LoadToBC  ref={this.loadToBC} />

                <hr />

<Container>
  <h3> Choose Public file to send to IPFS </h3>
  <Form onSubmit={this.onSubmit}>
    <input 
      type = "file"
      onChange = {this.captureFile}
    />
     <Button 
     bsStyle="primary" 
     type="submit"> 
     Store public text extraction to IPFS and save address to metamask 
     </Button>
  </Form>

  <hr/>
    <Button onClick = {this.onClick}> Get Transaction Receipt </Button>

      <Table bordered responsive>
        <thead>
          <tr>
            <th>Tx Receipt Category</th>
            <th>Values</th>
          </tr>
        </thead>
       
        <tbody>
          <tr>
            <td>IPFS Hash # stored on Eth Contract</td>
            <td>{this.state.ipfsHash}</td>
          </tr>
          <tr>
            <td>Ethereum Contract Address</td>
            <td>{this.state.ethAddress}</td>
          </tr>

          <tr>
            <td>Tx Hash # </td>
            <td>{this.state.transactionHash}</td>
          </tr>

          <tr>
            <td>Block Number # </td>
            <td>{this.state.blockNumber}</td>
          </tr>

          <tr>
            <td>Gas Used</td>
            <td>{this.state.gasUsed}</td>
          </tr>                
        </tbody>
    </Table>
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

export default CreateL
