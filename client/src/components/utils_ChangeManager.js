import { createPortal } from "react-dom";

const changeManager = {
  /**
   * Ask change nego via smart contract intermediary
   * 
   */
  requestChange: function(addressesToNotify,pubHash,reqHash){
    // request change

    var updAddresses = [];
    for(var i=0; i<addressesToNotify.length; i++){
      if(addressesToNotify[i].slice(0,2) !== '0x'){
        updAddresses.push('0x'+addressesToNotify[i]);
      }
      else{
        updAddresses.push(addressesToNotify[i]);
      }

    }

    this.state.contractProcess.methods.requestChange(this.state.accounts[0], updAddresses, pubHash+"|"+reqHash, pubHash, reqHash).send({
      from: this.state.accounts[0]
    }, (error) => {
              console.log(error);
    }); //storehash 

   // send request to list of addresses with ipfs hash of public nodes and relations. 

  },


  /**
   * Public graph update processing > generate public view data saved to ipfs --> peers will examinate data
   * 
   */
  publicGraphUpd: function(publicNodes){
    alert('choreography task - negotiation launched');

    console.log(publicNodes);

    var roles = this.state.roleMaps;
    var addressesToNotify = []
    publicNodes.forEach(function(node){
      console.log('node');
      console.log(node);

      roles.forEach(function(r){
        console.log(r);

        // test if role is accrole
        if ((node['src']===r['role'])||(node['tgt']===r['role'])) {

          var new_address = r['address'];
          if (new_address.slice(0,2)!=='0x'){
            new_address = '0x'+new_address;
          }
          addressesToNotify.push(new_address);
        }
      })
    });
    
    // generate cyto data and save to IPFS
    var newData = [];
    this.cy.elements().forEach(function (ele) {
      var newEle = {
        "data": ele['_private']['data'],
        "group": ele['_private']['group'],// group can be two types: nodes == activity, or edges == relation
      };

      console.log(newEle);


      if ((newEle.group === "nodes" ) && (newEle.data.name[0]===('!'||'?'))){
        console.log(newEle.data.name);

        var acName=newEle.data.name.split('(')[1].split(',')[0];
        var sender=newEle.data.name.split(', ')[1].split('>')[0].replace('-','').replace('-','');
        var receiver=newEle.data.name.split('>')[1].replace('*','').replace(')','').replace(' ','');

        newEle.data = {
          'id':newEle.data.id,
          'name':sender+'\n'+acName+'\n'+receiver,
          'nbr':0,
          'properName':sender+'\n'+acName+'\n'+receiver
        }

      }

      var classes = Array.from(ele['_private']['classes']).join(' ');
      if (classes !== '') {
        newEle['classes'] = classes;
      }
      newData.push(newEle);
    });

    
    this.publicUpd(Buffer.from(JSON.stringify(newData)), addressesToNotify);
    
  },

  /**
   * Private graph update processing > calls the API to update the markings and nodes.
   * 
   */
  privateGraphUpd: function() {


      var newData = [];

      // retrieve data 
      this.cy.elements().forEach(function (ele) {
        var newEle = {
          "data": ele['_private']['data'],
          "group": ele['_private']['group'],// group can be two types: nodes == activity, or edges == relation
        };

        var classes = Array.from(ele['_private']['classes']).join(' ');
        if (classes !== '') {
          newEle['classes'] = classes;
        }
        newData.push(newEle);
      });

    
      this.privateUpd(            {
        newData: newData,
        projID: this.state.projectionID,
        processID: this.state.processID
      });
      console.log('new graph version saved!')
      //window.location = '/welcomeinstance';
    }
 
}

export default changeManager;



