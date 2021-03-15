import React, { Component } from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import '../style/boosted.min.css';
import Header from './Header';
import axios, { post } from 'axios';
import { Button } from 'react-bootstrap';

/**
 * Component ...
 */
class Homepage extends React.Component {
  constructor(props){
    super(props);
  }


  render(){
    return  <div>
             <Header/>
             <div class="bg-green pt-5 pb-3">

<div class='container'>

             <section className="jumbotron text-center">
            <div className="container">
            <h1>DCR projecion tool</h1>
            <p className="lead text-muted">Welcome to the experimental platform.</p>
            <p>
                <a href="/welcomeinstance" className="btn btn-primary my-2">My instances</a>
                <a href="/welcomemodel" className="btn btn-secondary my-2">My process models</a>
            </p>
            </div>
        </section>


            </div>
            </div>
            </div>

            
;
  }
}

export default Homepage
