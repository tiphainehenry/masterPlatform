import React from 'react';
import Header from './Header';
import { Button, Row, Form, Container } from 'react-bootstrap';

import SidebarModel from './SidebarModel';
import ipfs from '../ipfs';
import axios from 'axios';


import AdminRoleManager from '../contracts/AdminRoleManager.json';
import nft from '../contracts/NFTContract.json';

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
            name: "default",
            ipaddress: "192.168.0.1",
            selectValue: "Actuators",
            roles: [],
            myRoles: [],
            addresses: [],
            admins: [],
            devices: [],
            newRole: "",
            allRegisteredRoles: []
        };

        this.onIPFSSubmit = this.onIPFSSubmit.bind(this);
        this.getDevices = this.getDevices.bind(this);

    }

    /**
     * Lists all processes and their role projections, and stores it into the tree state variable
     */
    componentWillMount = async () => {
        this.connectsToBC();
    };


    onChange(e) {
        if (e.target.name === "address")
            this.setState({ address: e.target.value })
        else if (e.target.name === "name")
            this.setState({ name: e.target.value })
        else if (e.target.name === "ipaddress") {
            this.setState({ipaddress : e.target.value})
        }
        else if (e.target.name === "selector") {
            this.setState({ selectValue: e.target.value })
            // this.setState({ isNew: (e.target.value === "") })
            // if (e.target.value !== "") {
            //     this.getListRoles('0x' + this.state.addresses[this.state.roles.indexOf(e.target.value)])
            // }

        } else if (e.target.name === "newRole") {
            this.setState({ newRoleName: e.target.value });
        }
    }

    onIPFSSubmit = async () => {

        //save document to IPFS,return its hash#, and set hash# to state
        //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#add
        // alert(this.state.processID);

        var input = { "type": this.state.selectValue, "name": this.state.name, "ipaddress" : this.state.ipaddress, "address" : this.state.accounts[0] };
        console.log(input);
        // var input = "Test";

        try {
            ipfs.files.add(Buffer.from(JSON.stringify(input)))
                .then(res => {
                    const hash = res[0].hash;
                    console.log(this.state.accounts[0], "https://infura-ipfs.io/ipfs/" + hash);
                    this.state.nftContract.methods.mintNFT(this.state.accounts[0], "https://infura-ipfs.io/ipfs/" + hash).send({ from: this.state.accounts[0] });
                    //   console.log(r);
                    console.log(hash);
                    this.setState({
                        ipfsHash: hash
                    }, () => {
                        localStorage.setItem('ipfsHash', JSON.stringify(this.state.ipfsHash))
                    });

                    //   axios.post(`http://localhost:5000/saveHash`,
                    //     {
                    //       "hash": hash,
                    //       "processId": this.state.processID,
                    //     },
                    //     { "headers": { "Access-Control-Allow-Origin": "*" } }
                    //   );

                    return ipfs.files.cat(hash)
                })
                .then(output => {
                    console.log(JSON.parse(output));
                    alert('Saved to IPFS')
                })
        }
        catch (error) {
            alert('Is the VPN on?');
        }
        this.getDevices();


    }; //onIPFSSubmit 

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
            const nftdeployedNetwork = nft.networks[networkId];

            const nftinstance = new web3.eth.Contract(
                nft.abi,
                nftdeployedNetwork && nftdeployedNetwork.address,
            );
            this.setState({ instance: instance })
            this.setState({ web3, accounts, contract: instance, nftContract: nftinstance });
            this.getDevices();

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

    /**
     * get the list of available roles in the SC then split the name and the address of the role
     */


    async getDevices() {
        const dev = await this.state.nftContract.methods.getAllTokens().call();
        const dev2 = await this.state.nftContract.methods.getCounterCount().call();
        let workedData = [];
        for (let i = 0; i < dev.length; i++) {
            // console.log(d);
            let d = dev[i];
            await axios.get(d).then((response) => {
                workedData.push(
                    <tr>
                        <td>{i}</td>
                        <td>{response.data.type}</td>
                        <td>{response.data.name}</td>
                        <td>{response.data.ipaddress}</td>
                        <td>{response.data.address}</td>


                    </tr>
                );
            })
                .catch(error => console.error(error));
        }
        this.setState({ devices: workedData });
        console.log(dev, dev2);
        return workedData;
    }


    render() {
        const address = []
        const currAddress = '0x' + this.state.addresses[this.state.roles.indexOf(this.state.selectValue)]
        console.log(this.state.devices);
        // var Answer = this.state.roles.map((x, y) => <option key={y}>{x}</option>)
        var Answer = [<option key="actuator">Actuators</option>, <option key="sensor">Sensors</option>, <option key="tag">Tags</option>]

        return <div >
            <Header />
            <Row>
                <SidebarModel />

                <div className="bg-green col-md-9 ml-sm-auto col-lg-10 px-md-4">
                    <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 ">
                        <Container flex>

                            <div className='container'>
                                <h2>Devices management</h2>
                                <ul className="nav nav-tabs">
                                </ul>
                                <div className="tab-content" >
                                    <div className="tab-pane active" id="users">
                                        <form id="search-users" name="searchUsers">
                                            <div className="row">
                                                <div className="form-group col-12 col-lg-6">
                                                    <label className="is-required" for="role">Select a device type</label>
                                                    <select className="custom-select" name="selector" onChange={e => this.onChange(e)}>
                                                        {Answer}
                                                    </select>
                                                </div>
                                                <div className="form-group col-12 col-lg-6">
                                                    <label className="is-required" for="role">Name</label>
                                                    <input type="input" name="name" class="form-control required" onInput={e => this.onChange(e)} onChange={e => this.onChange(e)} required aria-required="true"  ></input>
                                                </div>
                                                <div className="form-group col-12 col-lg-6">
                                                    <label className="is-required" for="role">IP Address</label>
                                                    <input type="input" name="ipaddress" class="form-control required" onInput={e => this.onChange(e)} onChange={e => this.onChange(e)} required aria-required="true"  ></input>
                                                </div>
                                                <div className="form-group col-12 col-lg-6">
                                                    <Button onClick={this.onIPFSSubmit}>Mint a new device</Button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                                <br />
                                <ul className="nav nav-tabs"></ul>
                                <div className="tab-content" >
                                    <div className="tab-pane active" id="users">
                                        <form id="search-users" name="searchUsers">
                                            <div className="row">
                                                <div className='form-group col-12'>
                                                    <table className='table' >
                                                        <thead>
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Device's Type</th>
                                                                <th>Device's Name</th>
                                                                <th>IP address</th>
                                                                <th>Owner's Address</th>
                                                            </tr>

                                                        </thead>
                                                        <tbody>
                                                            {this.state.devices}
                                                        </tbody>
                                                    </table>

                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                <Form>
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
