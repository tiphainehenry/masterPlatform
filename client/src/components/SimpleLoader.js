import React from 'react';
import {Card } from 'react-bootstrap';
import '../style/boosted.min.css';

import Loader from "react-js-loader";

/**
 * Component ...
 */

//const history = createBrowserHistory({ forceRefresh: true });
class SimpleLoader extends React.Component {

  render() {
    return <div >

{this.props.load === 'loading' ?
      <>
      <div className="bg-green pt-5 pb-3 container align-items-center">
      <Card  bg={'light'} style={{ 'marginTop': '10vh', width: '100%' }}>
      <Card.Body style={{ 'marginTop': '5vh', width: '100%' }}>
        <div className={"item"}>
          <Loader type={this.props.type} bgColor={'#ff7900'} title={this.props.msg} size={100} />
        </div>

      </Card.Body>

      </Card>
      </div>
        </>
 :
      <></>}

    </div>
      ;
  }
}

export default SimpleLoader

