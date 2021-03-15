import React from 'react';
import Header from './Header';
import DCRgraph from './DCRgraph';
import { Card, Button, Row, Col, Form, Container } from 'react-bootstrap';
import SidebarModel from './SidebarModel';

import '../style/App.css';

/**
 * Welcome component 
 */
class WelcomeModel extends React.Component {
  constructor(props) {
    super(props);
  }


  render() {
    return <div>
      <Header />
      <Container fluid >
        <Row >
          <Col sm={2} >
            <SidebarModel />
          </Col>
          <Col >

            <div class="bg-green pt-5 pb-3">

              <div class='container'>
                <div class="row align-items-center">

                  <div class="col-12 col-md-6 col-lg-4">
                    <h2>Process Models Pannel</h2>
                    <p class="lead">
                      Welcome to the process models panel. Click on the sidebar to import a new graph or edit a projection.
                    </p>
                  </div>
                  <div class="col-12 col-md-6 col-lg-8">
                    <img src="aeroplane_flying_in_the_sky_rgb_white.png" alt="" class="img-fluid" id="resize" loading="lazy" />
                  </div>
                </div>



                <div className="well"></div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>;
  }
}

export default WelcomeModel
