import React, { useState } from 'react';
import Header from './Header';
import { Card, Button, Row, Col, Form, Container, Nav, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios, { get } from 'axios';

import SidebarModel from './SidebarModel';

import AdminRoleManager from '../contracts/AdminRoleManager.json';
import getWeb3 from '../getWeb3';



/**
 * Component displaying all possible projections to update
 */
class Authentification extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            auth: [],
            registered:false,
            username:'',
            isAdmin:false
        };

    }

    /**
     * Lists all processes and their role projections, and stores it into the tree state variable
     */
    componentWillMount = async () => {
        this.connectsToBC()
    };

    /**
     * Connect to Smart contract and get the status of your address
     */
    async connectsToBC() {

        try {
            const web3 = await getWeb3();
            const accounts = await web3.eth.getAccounts();
            console.log(accounts);
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = AdminRoleManager.networks[networkId];
            const instance = new web3.eth.Contract(
                AdminRoleManager.abi,
                deployedNetwork && deployedNetwork.address,
            );
            this.setState({ instance: instance })
            this.setState({ web3, accounts, contract: instance });
            const tmp = await instance.methods.imRole().call({from: this.state.accounts[0]});
            this.props.status(tmp)
        } catch (error) {
            console.error(error);
        }
    }
    render() {
        return (null)
    }
}

export default Authentification
