#  Hybrid on/off-chain DCR Choreographies
This portal proposes a DCR choreographies design and execution platform leveraging the blockchain at both stages.

Regarding the generation of local projections: 
- the public view is pushed onchain
- the participants generate locally their view by building on the public view.

Regarding the process execution:
- The shared public tasks are gathered together in a public DCR graph. The later is compiled and updated in the blokchain for trust purposes. 
- The tenant projections are updated locally for privacy concerns and communicate with the public DCR vis external events. 

Additionally, we leverage the on/off-chain mechanism for change management on running instances. A redesign of a private task is managed off-chain, while a redesign of a public task is managed in an on-chain fashion.

We use python Flask for the backend of the application and React for the front end. We use cytoscape.js, a React package, to generate the graph visualizations. Web3.js is used to connect the decentralized application to a blockchain network. Truffle manages the compilation and migration of the DCR smart contract, and Metamask controls contract interactions. 

The projection and bitvector algorithms can be found in the folder ./api/src/
The generated data is stored under ./src/projections/

## Documentation
- Local Backend: docs/docsBackend/_build/html/index.html
- Frontend: docs/docsFrontend/_build/html/index.html

## Functionalities
On the design side, the user can create a process template by designing a projection using the creation deck, or loading a textual DCR representation of the process.

The user then instantiates the process: the platform:
- separates the public and private projections out of the process description.  
- instantiates the public DCR smart contract stored in Ethereum with the newly generated public projection

On the execution side, each user can (1) execute its local projection, (2) have access to the execution logs of its local projection (activity start and end timestamps, state of execution of the task), (3) request changes, (4) accept/decline changes and update its projection when the public view updates.  

Examples of DCR graphs are accessible in the folder ./dcrInputs/.

### Local install
To install the app locally, the required environment is python, node, and npm. Clone the repo. Then: 
```bash
cd ~/client
pip install -r requirements.txt
npm install
```

### Running the code
To run the app locally, run the four commands below, one in each terminal:
```bash
cd ~/client && npm start #frontend 
cd ~/client/api && python api.py #backend

Launch local blockchain in terminal:

ganache-cli -m "east enjoy keen nut hat debris blur trophy alone steak large federal"
To use a specific port number :
```
ganache-cli --mnemonic="trend acid deal original skate oblige mountain erupt rebuild panic release response" -i 8545
```
If you have any issue with the contract size :
```
ganache-cli --mnemonic="trend acid deal original skate oblige mountain erupt rebuild panic release response" -i 8545 --gasLimit=0x1fffffffffffff --allowUnlimitedContractSize -e 1000000000
```
truffle migrate #migrate the contract
```
In a third terminal, run the bridge to connect the blockchain to the outside world:
```
npm run bridge
```
Make sure that the database is initially empty ! (Button 'delete all instances' in the 'my instances' panel)
