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
            listOfRoles: [],
            newRole:"",
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
            this.setState({ selectValue: e.target.value })
            this.setState({ isNew: (e.target.value === "") })
            if (e.target.value !== "") {
                this.getListRoles('0x' + this.state.addresses[this.state.roles.indexOf(e.target.value)])
            }
        } else if (e.target.name === "isAdmin") {
            this.setState(prevstate => ({ isAdmin: !prevstate.isAdmin }))
        } else if (e.target.name === "newRole") {
            this.setState({newRoleName: e.target.value});
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
     * Get the list of existing roles for an account
     */
    async getListRoles(address) {
        console.log(address);
        const roles = await this.state.instance.methods.getElemRoles(address).call()
        console.log(roles);
        var line = []
        for (let i = 0; i < roles.length; i++) {
            line.push(
                <tr>
                    <td>{i}</td>
                    <td>{roles[i]}</td>
                    <td><Button onClick={() => this.deleteRole(i)} class="btn btn-danger">Delete</Button></td>
                </tr>)
        }
        this.setState({ listOfRoles: line });
        return line
    }
    /**
     * get the list of available roles in the SC then split the name and the address of the role
     */
    async getRoles() {
        const roles = await this.state.instance.methods.getRoles().call()
        console.log(roles);
        var tmpRoles = []
        var tmpAddress = []
        var tmpAdmin = []
        roles.forEach(line => {
            const val = line.split('///')
            tmpRoles.push(val[0])
            tmpAddress.push(val[1])
            tmpAdmin.push(val[2] === "true" ? true : false)
        });
        this.setState({ roles: tmpRoles, addresses: tmpAddress, admins: tmpAdmin })
    }

    /**
     * Create a new role for an existing account
     */
     async addNewRole() {
        const add = '0x' + this.state.addresses[this.state.roles.indexOf(this.state.selectValue)]
        console.log(add);
        const res = await this.state.instance.methods.AddElemRole(add, this.state.newRoleName).send({ from: this.state.accounts[0] })
    }


    /**
     * delete one of the roles 
     * @param {index of the role to delete} index 
     */
    async deleteRole(index) {
        const add = '0x' + this.state.addresses[this.state.roles.indexOf(this.state.selectValue)]
        console.log("azer");
        const res = await this.state.instance.methods.RemoveElemRole(add, index).send({ from: this.state.accounts[0] })
        console.log("tyuiop");
    }

    /**
     * Create a new Account if Isnew or update an already existing Role
     * For now all addresses are hard coded  
     */
    async manageRole() {

        if (this.state.isNew) {
            try {
                const res = await this.state.instance.methods.newRole(this.state.address, this.state.name, !this.state.isAdmin).send({ from: this.state.accounts[0] })
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
        window.location.reload()
        this.getRoles()
    }
    render() {
        const address = []
        const currAddress = '0x' + this.state.addresses[this.state.roles.indexOf(this.state.selectValue)]

        if (this.state.isNew) {
            address.push(
                <>
                    <div class="form-group col-12 col-lg-6">
                        <label for="phone" class="is-required">Address</label>
                        <input type="input" name="address" class="form-control required" onInput={e => this.onChange(e)} onChange={e => this.onChange(e)} required aria-required="true"  ></input>
                    </div>

                    <div class="form-group col-12 col-lg-6">
                        <label class="is-required" for="role">New role name</label>
                        <input type="input" class="form-control required" onPaste={e => this.onChange(e)} name="name" onChange={e => this.onChange(e)}></input>
                    </div>

                    <div class="form-group col-12">
                        <div class="custom-control custom-checkbox custom-checkbox-role">
                            <input type='checkbox' name="isAdmin" onInput={e => this.onChange(e)} value={this.state.isAdmin} class="custom-control-input" autocomplete="off" />
                            <label class="custom-control-label custom-label-role" for="pro-check">Admin</label>
                        </div>
                    </div>
                    <div class="form-group col-12 ">
                        <button onClick={() => this.manageRole()} class="btn btn-primary">Create</button>
                    </div>
                </>)

        } else {
            address.push(
                <>
                    <div class="form-group col-12 col-lg-6">
                        <label class="is-required">Address</label>
                        <input type="input" value={currAddress} disabled class="form-control required" onInput={e => this.onChange(e)} onChange={e => this.onChange(e)} required aria-required="true" name="address" ></input>
                    </div>
                    <div class="form-group col-12 col-lg-6">
                        <label class="is-required" for="role">New subrole name</label>
                        <input type="input" class="form-control required" onPaste={e => this.onChange(e)} name="name" onChange={e => this.onChange(e)}></input>
                    </div>

                    <div class="form-group col-12 ">
                        <div class="custom-control custom-checkbox custom-checkbox-role">
                            <input type="checkbox" class="custom-control-input" id="pro-check" autocomplete="off" name="isAdmin" onInput={e => this.onChange(e)} value={this.state.admins[this.state.roles.indexOf(this.state.selectValue)]} defaultChecked={this.state.admins[this.state.roles.indexOf(this.state.selectValue)]} />
                            <label class="custom-control-label custom-label-role" for="pro-check">Admin</label>
                        </div>
                    </div>

                    <div class="form-group col-12 ">
                        <button type="submit" onClick={() => this.manageRole()} class="btn btn-primary">Update</button>
                    </div>
                    <div className='form-group col-12'>
                        <table className='table' striped bordered hover>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Role</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>new</td>
                                    <td><input type="input" class="form-control " onPaste={e => this.onChange(e)} name="newRole" onChange={e => this.onChange(e)}></input></td>
                                    <td><Button onClick={() => this.addNewRole()} class="btn btn-primary">{"  Add  "}</Button></td>
                                </tr>
                                {this.state.listOfRoles}
                            </tbody>
                        </table>
                    </div>
                </>)
        }
        var Answer = this.state.roles.map((x, y) => <option key={y}>{x}</option>)
        return <div >
            <Header />
            <Row>
                <SidebarModel />

                <div class="bg-green col-md-9 ml-sm-auto col-lg-10 px-md-4">
                    <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 ">
                        <Container flex>

                            <div className='container'>
                                <h2>Roles management</h2>
                                <ul class="nav nav-tabs">
                                </ul>
                                <div class="tab-content" >
                                    <div class="tab-pane active" id="users">
                                        <form >
                                            <div class="row">
                                                <div class="form-group col-12 col-lg-6">
                                                    <label class="is-required" for="role">Select an account</label>
                                                    <select class="custom-select" name="selector" onChange={e => this.onChange(e)}>
                                                        <option value="">Create new account</option>
                                                        {Answer}
                                                    </select>
                                                </div>
                                                {address}
                                            </div>
                                        </form>
                                    </div>
                                </div>
                                <Form>


                                    {/* <div className='row'>
    <label className='col-md-2'>Admin: </label>
    <input type='checkbox' name="isAdmin" onInput={e => this.onChange(e)} value={this.state.isAdmin}></input>
    </div> */}

                                    {/* <Button onClick={() => this.btnfct()} class="btn btn-primary my-2 my-sm-0">GET roles</Button> */}

                                </Form>

                            </div>
                        </Container>
                    </div>
                </div>

            </Row>
        </div>
    }
}

export default NewRole
