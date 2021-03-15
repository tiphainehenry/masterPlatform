/**
* cytoscape editing menu definition
*/
export function getMenuStyle() {

  var cytomenu_style = {
    // Customize event to bring up the context menu
    // Possible options https://js.cytoscape.org/#events/user-input-device-events
    evtType: 'cxttap',
    menuItemClasses: [
    ],
    ctxMenuClasses: [
    ],

    // List of initial menu items
    // A menu item must have either onClickFunction or submenu or both
    menuItems: [
      {
        id: 'remove', // ID of menu item
        content: 'remove', // Display content of menu item
        tooltipText: 'remove', // Tooltip text for menu item
        // Filters the elements to have this menu item on cxttap
        // If the selector is not truthy no elements will have this menu item on cxttap
        selector: 'node, edge',
        onClickFunction: this.remove,
        disabled: false, // Whether the item will be created as disabled
        show: true, // Whether the item will be shown or not
        hasTrailingDivider: true, // Whether the item will have a trailing divider
        coreAsWell: false, // Whether core instance have this item on cxttap
        submenu: [] // Shows the listed menuItems as a submenu for this item. An item must have either submenu or onClickFunction or both.
      },
      {
        id: 'add-activity',
        content: 'add activity',
        tooltipText: 'add activity',
        selector: 'node',
        coreAsWell: true,
        submenu: [
          {
            id: 'add-local',
            content: 'add local activity',
            tooltipText: 'add local activity',
            selector: 'node',
            coreAsWell: true,
            onClickFunction: this.addLocalActivity

          },
          {
            id: 'add-choreo',
            content: 'add choreography activity',
            tooltipText: 'add choreography activity',
            selector: 'node',
            coreAsWell: true,
            onClickFunction: this.addChoreoActivity
          }
        ]
      },
      {
        id: 'add-relation',
        content: 'add relation',
        tooltipText: 'add relation',
        selector: 'node',
        coreAsWell: false,
        submenu: [
          {
            id: 'condition',
            content: 'add condition',
            tooltipText: 'add condition',
            selector: 'node',
            coreAsWell: true,
            onClickFunction: this.addCondition
          },
          {
            id: 'milestone',
            content: 'add milestone',
            tooltipText: 'add milestone',
            selector: 'node',
            coreAsWell: true,
            onClickFunction: this.addMilestone
          },
          {
            id: 'exclude',
            content: 'add exclude',
            tooltipText: 'add exclude',
            selector: 'node',
            coreAsWell: true,
            onClickFunction: this.addExclude
          },
          {
            id: 'include',
            content: 'add include',
            tooltipText: 'add include',
            selector: 'node',
            coreAsWell: true,
            onClickFunction: this.addInclude
          },
          {
            id: 'response',
            content: 'add response',
            tooltipText: 'add response',
            selector: 'node',
            coreAsWell: true,
            onClickFunction: this.addResponse
          }
        ]
      }
    ],
  };

  return cytomenu_style

}