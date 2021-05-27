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
            isAdmin: true,
            address: "",
            name: "",
            selectValue: "",
            roles: [],
            addresses: [],
            admins: [],
        };

    }

    /**
     * Lists all processes and their role projections, and stores it into the tree state variable
     */
    componentWillMount = async () => {
        this.connectsToBC()
    };

    onChange(e) {
        if (e.target.name === "address")
            this.setState({ address: e.target.value })
        else if (e.target.name === "name")
            this.setState({ name: e.target.value })
        else if (e.target.name === "selector") {
            this.setState({ isNew: (e.target.value === "") })
            this.setState({ selectValue: e.target.value})
        } else if (e.target.name === "isAdmin") {
            this.setState(prevstate => ({ isAdmin: !prevstate.isAdmin }))
        }
    }
    /**
     * Connect to Smart contract
     */
    async connectsToBC() {
        try {
            const web3 = await getWeb3();
            const accounts = await web3.eth.getAccounts();
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = AdminRoleManager.networks[networkId];
            const instance = new web3.eth.Contract(
                AdminRoleManager.abi,
                deployedNetwork && deployedNetwork.address,
            );
            this.setState({ instance: instance })
            this.setState({ web3, accounts, contract: instance });
            this.getRoles()
        } catch (error) {
            //alert(
            //  `Failed to load web3, accounts, or contract. Check console for details.`,
            //);
            console.error(error);
        }
    }
    /**
     * get the list of available roles in the SC then split the name and the address of the role
     */
    async getRoles() {
        const roles = await this.state.instance.methods.getRoles().call()
        var tmpRoles = []
        var tmpAddress = []
        var tmpAdmin = []
        roles.forEach(line => {
            const val = line.split('///')
            tmpRoles.push(val[0])
            tmpAddress.push(val[1])
            tmpAdmin.push(val[2] === "false" ? true : false)
        });
        this.setState({ roles: tmpRoles, addresses: tmpAddress, admins: tmpAdmin })
    }
    /**
     * Create a new Role if Isnew or update an already existing Role
     * For now all addresses are hard coded  
     */
    //TODO Add the addresses to the SC call 
    async manageRole() {

        if (this.state.isNew) {
            const address = '0xB075d6DA74408C291c86c0e651dd10e962efc82D'
            try {
                const res = await this.state.instance.methods.newRole(this.state.address, this.state.name, this.state.isAdmin).send({ from: this.state.accounts[0] })
            }
            catch {
                alert('Unable to create this role')
            }
        }
        else {
            try {
                const address = '0x' + this.state.addresses[this.state.roles.indexOf(this.state.selectValue)]
                var res = await this.state.instance.methods.updateRole(address, this.state.name, this.state.isAdmin).send({ from: this.state.accounts[0] })
            } catch {
                alert('Unable to update this role')
            }
        }
        window.location.reload(false)
        this.getRoles()
    }
    render() {
        const address = []
        if (this.state.isNew) {
            address.push(<div className='row'>
                <label className='col-md-2'>Address : </label>
                <input type="input" name="address" onInput={e => this.onChange(e)} onChange={e => this.onChange(e)}></input>
            </div>)
            address.push(
                <div className='row'>
                    <label className='col-md-2'>Admin: </label>
                    <input type='checkbox' name="isAdmin" onInput={e => this.onChange(e)} value={this.state.isAdmin}></input>
                </div>)
            address.push(<div>
                <Button onClick={() => this.manageRole()} class="btn btn-primary my-2 my-sm-0">Create</Button>
            </div>
            )
        } else {
            address.push(<div className='row'>
                <label className='col-md-12'>Adress : 0x{this.state.addresses[this.state.roles.indexOf(this.state.selectValue)]}</label>
            </div>)
            address.push(
                <div className='row'>
                    <label className='col-md-2'>Admin: </label>
                    <input type='checkbox' name="isAdmin" onInput={e => this.onChange(e)} value={this.state.admins[this.state.roles.indexOf(this.state.selectValue)]} defaultChecked={this.state.admins[this.state.roles.indexOf(this.state.selectValue)]}></input>
                </div>)
            address.push(<div>
                <Button onClick={() => this.manageRole()} class="btn btn-primary my-2 my-sm-0">Update</Button>
            </div>)
        }
        var Answer = this.state.roles.map((x, y) => <option key={y}>{x}</option>)
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
                                        {Answer}
                                    </select>
                                    <div style={{ marginTop: "1vh" }} className='row'>
                                        <label className='col-md-2'>Name: </label>
                                        <input type="input" onPaste={e => this.onChange(e)} name="name" onChange={e => this.onChange(e)}></input>
                                    </div>
                                    {/* <div className='row'>
                                        <label className='col-md-2'>Admin: </label>
                                        <input type='checkbox' name="isAdmin" onInput={e => this.onChange(e)} value={this.state.isAdmin}></input>
                                    </div> */}
                                    <br />
                                    {address}
                                    <br />
                                    <br />
                                    {/* <Button onClick={() => this.btnfct()} class="btn btn-primary my-2 my-sm-0">GET roles</Button> */}

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
