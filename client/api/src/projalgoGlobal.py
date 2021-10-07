import os
import pathlib
import argparse
import sys
import json

from src.utils.formatting import cleanName, getFileName, groupItems
from src.utils.chunking import extractChunks
from src.utils.vectorization import vectorize
from src.utils.graphDataTranslator import generateGraph

"""
    Set of functions to generate the global view of a dcr text description
    >> json, cytoscape, and vectorized views
    ...

    Methods
    -------
    :generateGlobalProjection(data, filename): generates global projection (text, cytoscape, and vector descriptions) out of a textual DCR description
    :projectGlobal(processID, data, target): generates global projection (text, cytoscape, and vector descriptions) out of a textual DCR description

"""


def generateGlobalProjection(data, filename):
    """ generates global projection (text, cytoscape, and vector descriptions) out of a textual DCR description

    :param processID: the ID of the current process. eg: "p1"
    :param data: json description of the global dcr
    :param target: the path where the projection will be saved. eg: './client/src/projections/'
    :returns: global projection, empty list (generated for external ids of the role projection views -- functions are shared)

    """

    chunks, roles = extractChunks(data)
    #print("2.1/ chunks")
    #print(chunks)
    #print("2.2/ roles")
    #print(roles)
    
    # Extract events
    globalEvents = []
    globEv = []
    ind=0
    for event in chunks['events'] + chunks['internalEvents']: # events refer here to choreography events
        globalEvents.append(event.strip())
        globEv.append({
            'id':ind,
            'event':event.strip()
        })
        ind=ind+1

    # Extract linkages
    linkages = ["\n## Linkages ##"] + chunks['linkages'] 
    globRelations = []
    ind=0
    for rel in chunks['linkages']:
        globRelations.append({
            'id':ind,
            'relation':rel
        })
        ind=ind+1
    
    # Merge projection items
    projection = ["##### Global DCR #######"] + globalEvents + linkages

    # create role mapping
    roleMapping=[]
    ind=1
    for role in roles:
        roleMapping.append({
            'id':'r'+str(ind),
            'role':role
        })
        ind=ind+1    
    # update dcrTexts file
    data = {}
    
    data['global']={
        'events':globEv,
        'relations':globRelations
    }
    data['roleMapping']=roleMapping

    data['addresses']=chunks['addresses']
    with open(filename, 'w') as outfile:
        json.dump(data, outfile)
    return projection, []

def projectGlobal(processID, data, target):
    """
    generates global projection (text, cytoscape, and vector descriptions) out of a textual DCR description

    :param processID: the ID of the current process. eg: "p1"
    :param data: json description of the global dcr
    :param target: the path where the projection will be saved. eg: '../../client/src/projections/'
    """ 
    this_folder = os.path.dirname(os.path.abspath(__file__))
    print('[INFO] Starting Global Projection')
    projection, externalIds = generateGlobalProjection(data, os.path.join(target,"dcrTexts.json"))
    generateGraph(processID, projection, externalIds, target, "Global")
    
    vectorize(projection, os.path.join(target,"temp_vectGlobal"))
    
    print('[INFO] Global Projection generated')


def projectGlobalforPublicChange(processID, data, target):
    """
    generates global projection (text, cytoscape, and vector descriptions) out of a textual DCR description

    :param processID: the ID of the current process. eg: "p1"
    :param data: json description of the global dcr
    :param target: the path where the projection will be saved. eg: '../../client/src/projections/'
    """ 
    this_folder = os.path.dirname(os.path.abspath(__file__))
    print('[INFO] Starting Global Projection')
    projection, externalIds = generateGlobalProjection(data, os.path.join(target,"dcrTexts.json"))
    generateGraph(processID, projection, externalIds, target, "Global")    
    #vectorize(projection, os.path.join(target,"temp_vectGlobal"))
    
    print('[INFO] Global Projection generated')
