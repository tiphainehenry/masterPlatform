const activityUpdHelpers = {

    /**
    * handle activity update
    * @param e: click event
    */
    handleActivityName: function (e) {
        e.preventDefault();
        const noSpaceValue = e.target.value.replace(' ', '')
        this.setState({
            elemClicked: {
                id: this.state.elemClicked.id,
                activityName: noSpaceValue,
                classes: this.state.elemClicked.classes,
                type: this.state.elemClicked.type
            },
        });
    },

    /**
    * handle local tenant name update
    * @param e: click event
    */
    handleTenant: function (e) {
        e.preventDefault();
        this.setState({ tenantName: e.target.value });
    },

    /**
    * handle sender choreography name update
    * @param e: click event
    */
    handleSender: function (e) {
        e.preventDefault();
        this.setState({
            choreographyNames: {
                sender: e.target.value,
                receiver: this.state.choreographyNames.receiver
            }
        });
    },

    /**
    * handle receiver choreography name update
    * @param e: click event
    */
    handleReceiver: function (e) {
        e.preventDefault();
        this.setState({
            choreographyNames: {
                sender: this.state.choreographyNames.sender,
                receiver: e.target.value
            }
        });
    },

    /**
    * handle include marking state change
    * @param e: click event
    */
    handleMI: function (e) {
        switch (this.state.markings.included) {
            case 0:
                this.setState({
                    markings: {
                        included: 1,
                        executed: this.state.markings.executed,
                        pending: this.state.markings.pending
                    }
                });
                break;
            default:
                this.setState({
                    markings: {
                        included: 0,
                        executed: this.state.markings.executed,
                        pending: this.state.markings.pending
                    }
                });
                break;
        }
    },

    /**
    * handle executed marking state change
    * @param e: click event
    */
    handleME: function (e) {
        switch (this.state.markings.executed) {
            case 0:
                this.setState({
                    markings: {
                        included: this.state.markings.included,
                        executed: 1,
                        pending: this.state.markings.pending
                    }
                });
                break;
            default:
                this.setState({
                    markings: {
                        included: this.state.markings.included,
                        executed: 0,
                        pending: this.state.markings.pending
                    }
                });
                break;
        }

    },

    /**
    * handle pending marking state change
    * @param e: click event
    */
    handleMP: function (e) {
        switch (this.state.markings.pending) {
            case 0:
                this.setState({
                    markings: {
                        included: this.state.markings.included,
                        executed: this.state.markings.executed,
                        pending: 1
                    }
                });
                break;
            default:
                this.setState({
                    markings: {
                        included: this.state.markings.included,
                        executed: this.state.markings.executed,
                        pending: 1
                    }
                });
                break;
        }

    },
}

export default activityUpdHelpers;



