#  Hybrid on/off-chain DCR Choreographies
This portal proposes a DCR choreographies design and execution platform leveraging the blockchain at both stages.

Regarding the generation of local projections: 
- the public view is pushed onchain
- the participants generate locally their view by building on the public view.

Regarding the process execution:
- The shared public tasks are gathered together in a public DCR graph. The later is compiled and updated in the blokchain for trust purposes. 
- The tenant projections are updated locally for privacy concerns and communicate with the public DCR vis external events. 

We use python Flask for the backend of the application and React for the front end. We use cytoscape.js, a React package, to generate the graph visualizations. Web3.js is used to connect the decentralized application to a blockchain network. Truffle manages the compilation and migration of the DCR smart contract, and Metamask controls contract interactions. 

The projection and bitvector algorithms can be found in the folder ./api/src/
The generated data is stored under ./src/projections/

## Documentation
- Local Backend: docs/docsBackend/_build/html/index.html
- Frontend: docs/docsFrontend/_build/html/index.html

## Functionalities
On the design side, the platform: 
- separates the public and private projections out of a given textual representation. 
- instantiates the public DCR smart contract stored in Ethereum with the newly generated public projection

On the execution side, each user can (1) execute its local projection, (2) have access to the execution logs of its local projection (activity start and end timestamps, state of execution of the task). 

Examples of DCR graphs are accessible in the folder ./dcrInputs/.

### Local install
To install the app locally, the required environment is python, node, and npm.
After cloning the repo, in the folder ./client, launch 'pip install -r requirements.txt' and 'npm install'

### Running the code
To run the app locally, run the four commands below, one in each terminal:
```bash
cd ~/client && npm start #frontend 
cd ~/client/api && python api.py #backend
ganache-cli #deploy the ethereum testnet
truffle migrate #migrate the contract
```
