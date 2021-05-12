import React from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import '../style/boosted.min.css';
import Header from './Header';
import { post } from 'axios';
import LoadToBC from './LoadToBC';
import { Button, Row, Col, Container } from 'react-bootstrap';
import SidebarModel from './SidebarModel';

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
      processID:''
    };
    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
    this.fileUpload = this.fileUpload.bind(this);
  }

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
