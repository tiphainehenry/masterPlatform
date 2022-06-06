#  A trustworthy decentralized change propagation mechanism for declarative choreographies

## Installation and execution
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

truffle migrate #migrate the contract
```
In a third terminal, run the bridge to connect the blockchain to the outside world:
```
npm run bridge
```
Make sure that the database is initially empty ! (Button 'delete all instances' in the 'my instances' panel)


## Version 1.0: a DCR choreographies design and execution platform leveraging the blockchain at both stages.
Regarding the generation of local projections: 
- the public view is pushed onchain
- the participants generate locally their view by building on the public view.

Regarding the process execution:
- The shared public tasks are gathered together in a public DCR graph. The later is compiled and updated in the blokchain for trust purposes. 
- The tenant projections are updated locally for privacy concerns and communicate with the public DCR vis external events. 

We use python Flask for the backend of the application and React for the front end. We use cytoscape.js, a React package, to generate the graph visualizations. Web3.js is used to connect the decentralized application to a blockchain network. Truffle manages the compilation and migration of the DCR smart contract, and Metamask controls contract interactions. 

The projection and bitvector algorithms can be found in the folder ./api/src/
The generated data is stored under ./src/projections/

## Version 1.1: Change introduction and propagation in running instance  

We leverage the on/off-chain mechanism for change management on running instances. A redesign of a private task is managed off-chain, while a redesign of a public task is managed in an on-chain fashion.

### Functionalities
On the design side, the user can create a process template by designing a projection using the creation deck, or loading a textual DCR representation of the process.

The user then instantiates the process: the platform:
- separates the public and private projections out of the process description.  
- instantiates the public DCR smart contract stored in Ethereum with the newly generated public projection

On the execution side, each user can (1) execute its local projection, (2) have access to the execution logs of its local projection (activity start and end timestamps, state of execution of the task), (3) request changes, (4) accept/decline changes and update its projection when the public view updates. 

### Reproducing the experiment:  
Step (1) Deploy the instance
* from the main page, go to the admin view "My process models"
* On the sidebar, in the "launch new instance" section, click on the link "instantiate template". Select the TourismPass template.
* Select the projection strategy (for a direct processing, select: 'Global view' (public view corresponds to the approach described in version 1.0)) 
* Then follow the webpage instructions to deploy the instance: (i) project locally, (ii) upload the public view into ipfs, and (iii) instantiate the view into the smart contract. Validate the transaction using metamask.

Step (2) Create and send a change request  
* from the main page, go to "my running instances". You have access to all running instances connected to your metamask account.
* click on the edit button of the instance you wish to modify.
* Right click on the edition pannel to add/remove activites or relations. Forbidden operations triggering deadlock or livelock paths are disabled.
* Then, click on the button at the end of the page to submit a change request. If a segment of the change request is public, the webpage triggers a transaction with metamask which you can validate. 

All change requests are accessible on the "My notifications" page. 

Step (3) Answer a change request
* You can change your account to sign in as one of the change endorsers.  
* On the header, click on the "Change Requests" page link. From there, you can have access to your change endorsement requests.
* For each request: you can see the change, and send your endorsement (accept/deny) to the smart contract. 

Once all particpants have done step (3), and if/when participants do not have remaining pending activities, the instance is locked for change propagation.

Step (4) Update your running instance (After all endorsers have answered the request)
* Click on the "project locally my instance" button
* Once the projection is complete, click on the "confirm projection" button to notify the smart contract of the projection
 
Once all particpants have done step (4), the updated instance is unlocked for execution.

## Documentation
- Local Backend: docs/docsBackend/_build/html/index.html
- Frontend: docs/docsFrontend/_build/html/index.html

