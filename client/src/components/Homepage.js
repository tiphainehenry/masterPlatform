import React from 'react';
import '../style/boosted.min.css';
import Header from './Header';

/**
 * Component ...
 */
class Homepage extends React.Component {

  render() {
    return <div>
      <Header />
      <div className="bg-green pt-5 pb-3">

        <div className='container'>

          <section className="jumbotron text-center">
            <div className="container">

              <h1>DCR projecion tool</h1>
              <p className="lead text-muted">Welcome to the experimental platform.</p>
              <div >
              </div>
            </div>
            <br />
            <br />

            <div className="container">
              <div className="row justify-content-center">
                <div className="col-4">
                  <div className="card" style={{ width: 18 + 'rem' }}>
                    <img className="card-img-top" src="API-S_RGB-5.png" alt="Card cap"></img>

                    <div className="card-body">
                      <h5 className="card-title">Monitor deployed instances</h5>
                      <p className="card-text">access all the inter-organizational process instances currently running, and execute role activities on the dedicated projections.</p>
                      <a href="/welcomeinstance" className="btn btn-secondary my-2">Go to my instances</a>
                    </div>
                  </div>
                </div>
                <div className="col-4">
                  <div className="card" style={{ width: 18 + 'rem' }}>
                    <img className="card-img-top" src="API-S2_RGB-5.png" alt="Card cap"></img>
                    <div className="card-body">
                      <h5 className="card-title">Create new models</h5>
                      <p className="card-text">access the template libraries, or create a new inter-organizational process model from scratch, and deploy it.</p>
                      <a href="/welcomemodel" className="btn btn-secondary my-2">Go to my process models</a>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </section>


        </div>
      </div>
    </div>


      ;
  }
}

export default Homepage
