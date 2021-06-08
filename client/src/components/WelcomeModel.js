import React from 'react';
import Header from './Header';
import { Row, Col, Container } from 'react-bootstrap';
import SidebarModel from './SidebarModel';

import '../style/App.css';

/**
 * Welcome component 
 */
class WelcomeModel extends React.Component {

  render() {
    return <div>
      <Header />
      <Container fluid >
        <Row>
            <SidebarModel />

            <div class="bg-green col-md-9 ml-sm-auto col-lg-10 px-md-4">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 ">

              <div class='container-fluid'>
                <div class="row align-items-center flex">

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
            </div>
            </Row>
      </Container>
    </div>;
  }
}

export default WelcomeModel
