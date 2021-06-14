import React from 'react';

import { Table, Button, Form, ListGroup, Row, Col, Container } from 'react-bootstrap';

import '../style/boosted.min.css';

import Header from './Header';
import LoadToBCL from './LoadToBC';
import SidebarModel from './SidebarModel';

import axios from 'axios';
import ipfs from '../ipfs';
import getWeb3 from "../getWeb3";

import PublicDCRManager from '../contracts/PublicDCRManager.json';

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

      selectValue: 'p_to_g'

    };
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onChangeView = this.onChangeView.bind(this);

    this.fileUpload = this.fileUpload.bind(this);
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
      this.setState({ wkState: 'Create Workflow OnChain.' })

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
        console.log('retrieved data:', JSON.parse(output))
      })

  }; //onIPFSSubmit 

  /**
   * uploads file on user click.
   * @param e click event
   */
  onFormSubmit(e) {
    e.preventDefault() // Stop form submit
    this.fileUpload(e, this.state.file).then((response) => {
      console.log(response.data);
      if (response.data === "ok") {
        // save to BC
        console.log('projection done');
        //this.loadToBC.current.handleCreateWkf();
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
  fileUpload(e, file) {
    e.preventDefault();

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

    return axios.post(url, formData, config)
  }

  onChangeView(e) {
    this.setState({ selectValue: e.target.value });
  }


  render() {
    return <div>
      <Header />

      <Row>
        <SidebarModel />

        <div class="bg-green col-md-9 ml-sm-auto col-lg-10 px-md-4">
          <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 ">

            <Container>

              <div class="container">
                <h2>My Process Models</h2>
                <h3>Import and project a new process model</h3>

                <div class="row">
                  <div class="col-sm-6">
                    <form role="form" id="myForm">

                      <div class="form-group">
                        <label class="is-required" for="role">Select projection type</label>
                        <select class="custom-select" name="view-selector" onChange={e => this.onChangeView(e)}>
                          <option value="p_to_g">Public view</option>
                          <option value="g_to_p">Global view</option>
                        </select>
                        <span class="form-text small text-muted" id="helpTextFile">
                          Public view: declare ONLY the public tasks of the participants.
                          Global view: declare all tasks (public+private).</span>

                      </div>


                      <div class="custom-file">

                        <form onSubmit={this.onFormSubmit}>
                          <input type="file" class="custom-file-input" id="exampleInputFile" onChange={this.onChange} aria-describedby="helpTextFile" />
                          <label class="custom-file-label" for="exampleInputFile">Input file</label>
                          <span class="form-text small text-muted" id="helpTextFile">The three input files used for our experiments are accessible in the <a href='https://github.com/tiphainehenry/react-cyto/'>dcrInputs repository</a> of our github.</span>
                        </form>
                      </div>

                      <div class="form-group my-3">
                            <button type="submit" class="btn btn-secondary">1. Project</button>
                          </div>

                      <div class="form-group my-3" onSubmit={this.onIPFSSubmit}>
                        <button type="submit" class="btn btn-secondary">2. Save public text extraction to IPFS</button>
                      </div>

                      <LoadToBCL ref={this.loadToBC} ipfsHash={this.state.ipfsHash} processID={this.state.processID} />

                    </form>
                  </div>
                </div>

                <hr />
                <h5>Step 2</h5>
                <p>To execute the process, navigate between the different role projections accessible via the 'My running instances' header. </p>
                <p>
                  Each graph comprises four types of events. </p>
                <ListGroup>
                  <ul>(1) Send choreography events are marked with (!)</ul>
                  <ul>(2) Receive choreography events are marked with (?)</ul>
                  <ul>(3) Internal events comprise the event name only.</ul>
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
            </Container>
          </div>
        </div>

      </Row>
    </div>


      ;
  }
}

export default CreateL
