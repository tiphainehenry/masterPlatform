import React from 'react';
import '../style/boosted.min.css';
import { useSelector, useDispatch } from 'react-redux'
import Header from './Header';
import Authentification from './Authentification'
import { Container, Card, CardDeck } from 'react-bootstrap';

/**
 * Component ...
 */


class Homepage extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      auth: {isRole:false},
      registered: false,
      username: '',
      isAdmin: false,
      childState: null,
      once: true,
    }
    this.childElement = React.createRef()
    this.getStatus = this.getStatus.bind(this)
  }

  getStatus = auth => this.setState({ auth })

  render() {
    return (<div>
      <Header/>
      <Authentification status={this.getStatus} />
      {this.state.auth.isRole ?
        <div>
            <div className='container'>
              <section className="jumbotron text-center">
                <div className="container">
                  <h1>DCR projecion tool</h1>
                  <p className="lead text-muted">Welcome to the experimental platform.</p>
                  <p className="lead text-muted">You are connected as {this.state.auth.name}</p>
                  <p className="lead text-muted">Admin : {this.state.auth.isAdmin ? "true" : "false"}</p>
                  <p className="lead text-muted">Role : {this.state.auth.isRole ? "true" : "false"}</p>
                </div>
                <br />
                <br />
                <CardDeck className="row justify-content-center">
                <Card className="homepage-card">
                        <img className="card-img-top" src="API-S_RGB-5.png" alt="Card cap"></img>
                        <div className="card-body">
                          <h5 className="card-title">Monitor deployed instances</h5>
                          <p className="card-text">access all the inter-organizational process instances currently running, and execute role activities on the dedicated projections.</p>
                          <a href="/welcomeinstance" className="btn btn-secondary my-2">Go to my instances</a>
                        </div>
                      </Card>
                      <Card className="homepage-card">
                        <img className="card-img-top" src="API-S2_RGB-5.png" alt="Card cap"></img>
                        <div className="card-body">
                          <h5 className="card-title">Create new models</h5>
                          <p className="card-text">access the template libraries, or create a new inter-organizational process model from scratch, and deploy it.</p>
                          <a href="/welcomemodel" className="btn btn-secondary my-2">Go to my process models</a>
                        </div>
                      </Card>
                </CardDeck>
              </section>
            </div>
          </div>
        :
        <div className="bg-green pt-5 pb-3">
          <div className='container'>
            <section className="jumbotron text-center">
              <div className="container">
                <h1>DCR projecion tool</h1>
                <p className="lead text-muted">Welcome to the experimental platform.</p>
              </div>
              <br />
              <br />
              <p style={{ color: 'Red' }}>Your Account isn't curently registered. Please contact admins</p>
            </section>
          </div>
        </div>}
    </div>
    )
  }
}

export default Homepage
