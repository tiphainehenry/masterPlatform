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
class NewRole extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isNew: true,
            address: "",
            name: "",
            selectValue: "",
        };

    }

    /**
     * Lists all processes and their role projections, and stores it into the tree state variable
     */
    componentWillMount = async () => {
        this.connectsToBC()
    };

    onChange(e) {
        console.log(e.target.value)
        console.log(e.target.name)
        if (e.target.name === "address")
            this.setState({ adress: e.target.value })
        else if (e.target.name === "name")
            this.setState({ name: e.target.value })
        else if (e.target.name === "selector") {
            console.log((e.target.value === ""));
            this.setState({ isNew: (e.target.value === "") })
            this.setState({ selectValue: e.target.value })
        }

    }

    async connectsToBC() {

        try {
            const web3 = await getWeb3();
            const accounts = await web3.eth.getAccounts();
            console.log(accounts);
            const networkId = await web3.eth.net.getId();
            console.log(networkId);

            const deployedNetwork = AdminRoleManager.networks[networkId];
            console.log(deployedNetwork);
            const instance = new web3.eth.Contract(
                AdminRoleManager.abi,
                deployedNetwork && deployedNetwork.address,
            );
            this.setState({instance: instance})
            console.log(instance)
            // const res = await instance.methods.getRoles().call();
            const aze = await instance.methods.getmessage().call();
            // console.log(res);
            console.log(aze);
            // console.log(await AdminRoleManager.methods.getRoleCount().call())
            // console.log(res)

            this.setState({ web3, accounts, contract: instance });


        } catch (error) {
            //alert(
            //  `Failed to load web3, accounts, or contract. Check console for details.`,
            //);
            console.error(error);
        }
    }

    async manageRole() {
        if (this.state.isNew) {
            const address = '0xB075d6DA74408C291c86c0e651dd10e962efc82D'
            var res = await this.state.instance.methods.newRole(address, this.state.name).call()
            console.log(res);
            res = await this.state.instance.methods.getRoleCount().call()
            console.log(res)
        }
         else {
            const address = '0xB075d6DA74408C291c86c0e651dd10e962efc82D'
            var aze = await this.state.instance.methods.getName(address).call()
            console.log(aze);
            var res = await this.state.instance.methods.getRoles().call()
            console.log(res);
        }
        // console.log(await this.state.contract.methods.getRoleCount().call())
        // var res = await AdminRoleManager.methods.newRole('0xB075d6DA74408C291c86c0e651dd10e962efc82D', "test").call()
        // console.log(await AdminRoleManager.methods.getRoleCount().call())
    }
    render() {
        console.log(this.state)

        const address = []
        if (this.state.isNew) {
            address.push(<div className='row'>
                <label className='col-md-2'>Address : </label>
                <input type="input" name="address" onChange={e => this.onChange(e)}></input>
            </div>)
        } else {
            address.push(<div className='row'>
                <label>Adress : azert</label>
            </div>)
        }

        return <>
            <div>
                <Header />
                <Container fluid >
                    <Row >
                        <Col sm={2} style={{ 'padding-left': 0, 'padding-right': 0 }}>
                            <SidebarModel />
                        </Col>
                        <Col style={{ 'padding-left': 0, 'padding-right': 0 }}>
                            <div className='bg-green pt-5 pb-3'>
                                <div className='container'>
                                    <h2>Roles management</h2>
                                    <h5>Select a role</h5>
                                    <select name='selector' onChange={e => this.onChange(e)} style={{ 'width': '40%', 'marginLeft': '25%' }}>
                                        <option value="">Create a new role</option>
                                        <option value="toto">toto</option>
                                    </select>
                                    <br />
                                    <br />
                                    <div className='row'>
                                        <label className='col-md-2'>Name : </label>
                                        <input type="input" name="name" onChange={e => this.onChange(e)}></input>
                                    </div>
                                    <br />
                                    {address}
                                    <Button onClick={() => this.manageRole()} class="btn btn-primary my-2 my-sm-0">{this.state.IsNew ? "Create" : "Update"}</Button>
                                    <br />
                                    <br />
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    }
}

export default NewRole
