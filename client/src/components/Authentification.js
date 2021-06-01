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
            var ret = {isRole:false, name:"", isAdmin:false}
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = AdminRoleManager.networks[networkId];
            const instance = new web3.eth.Contract(
                AdminRoleManager.abi,
                deployedNetwork && deployedNetwork.address,
            );
            const tmp = await instance.methods.imRole().call({from: accounts[0]});
            if (tmp[0] !== "Not Connected") {
                ret.isRole = true
                ret.name = tmp[0]
                ret.isAdmin = (tmp[1] === "false" ? false : true)
            }
            this.props.status(ret)
        } catch (error) {
            console.error(error);
        }
    }
    render() {
        return (null)
    }
}

export default Authentification
