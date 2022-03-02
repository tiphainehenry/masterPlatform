import React from 'react';
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
            registered: false,
            username: '',
            isAdmin: false
        };

        this.getListRoles=this.getListRoles.bind(this);
        this.getAllRoles=this.getAllRoles.bind(this);

    }
    componentWillMount = async () => {
        this.connectsToBC()
    };


    async getImRoles(allRoles,myRoles){
        const { accounts, contract } = this.state;

        var ret = { isRole: false, name: "", isAdmin: false, roles:[],myRoles:[] }

        await contract.methods.imRole().call({ from: accounts[0] })
        .then(tmp=> {
            if (tmp[0].toString() !== "Not registered") {
                ret.isRole = true
                ret.name = tmp[0]
                ret.isAdmin = (tmp[1] === "false" ? false : true)
                ret.roles=allRoles
                ret.myRoles=myRoles
            } else {
                ret.isRole = false
                ret.name = ""
                ret.isAdmin = false
                ret.roles=['null']
                ret.myRoles=['null']

            }
            this.props.status(ret)                    

            //alert(ret);
            //console.log(ret);

        });

    }

    async getListRoles(allRoles) {
        const { accounts, contract } = this.state;

        try{
            await contract.methods.getElemRoles(accounts[0]).call().then(myRoles=>{
                this.getImRoles(allRoles,myRoles);
        })
        }
        catch(error){
            console.log('oops');
        }



    }

    async getAllRoles(){
        const { accounts, contract } = this.state;

        try{

            await contract.methods.getAccountRoles().call({ from: accounts[0] }).then(all_roles=>{
            
                var cleanedRoles=[]
    
                for (var r in all_roles){
                    var cr=all_roles[r].split('///')[0]
                    //console.log(myRoles[r].split('///')[0])
                    if ((! cleanedRoles.includes(cr) ) & (cr !== '')){
                        cleanedRoles.push(cr)
                    }
                }                
                
                this.getListRoles(cleanedRoles);
                    
            })
            }
            catch(err){
                console.log(err)
            }

    }
    /**
     * Connect to Smart contract and get the status of your address
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


            this.setState({
                web3, accounts, contract: instance,
              });
            
            this.getListRoles(accounts[0]).then(res=>{
                    this.getAllRoles()
                    })    

        } catch (error) {
            console.error(error);
        }
    }
    render() {
        return (null)
    }
}

export default Authentification
