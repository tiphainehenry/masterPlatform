import os
import pathlib
import argparse
import sys
import json

from src.utils.formatting import cleanName, getFileName, groupItems, generateDictEvent, generateDictRelation, getRole, getRoleList, getSender, getReceiver
from src.utils.chunking import extractChunks, applyComposition, getEventDeclarationFromName
from src.utils.vectorization import vectorize
from src.utils.graphDataTranslator import generateGraph

"""
    Set of functions to generate the public view of a dcr text description
    >> json, cytoscape, and vectorized views
    ...

    Methods
    -------
    :filterOnChoreo(cNames, linkages): retrieves relations where choreography events are involved
    :addRoleExternals(events, filename): retrieves external events to a projection
    :addExternalEvents(cNames, chunks, filename): retrieves external events and relations
    :retrieveRelations(events, relations): retrieves relations missing after a projection (events are chunked due to sender and receiver projections)
    :generatePublicProjection(chunks, filename): generates public projection out of dcr textual chunked representation
    :projectPublic(processID, data, target): generates public projection (text, cytoscape, and vector descriptions) out of a textual DCR description

"""


def filterOnChoreo(cNames, linkages):
    """
    retrieves relations where choreography events are involved

    :param cNames: choreography names
    :param linkages: list of relations
    :returns: the list of relations where choreography events are involved
    """

    choreoLinkages = []
    for line in linkages:
        event1 = line.split()[0].strip()
        event2 = line.split()[2].strip()

        if (event1 in cNames) and (event2 in cNames):
            choreoLinkages.append(line)
        else:
            pass

    if len(choreoLinkages) == 0:
        choreoLinkages = ["#--> No choreography relation retrieved"]

    # + ["\n## WrongLinks ##"] + wrongLinks
    return ["\n## Linkages ##"] + choreoLinkages


def addRoleExternals(events, filename):
    """
    retrieves external events to a projection

    :param events: events to analyze
    :param filename: filename where projection data is stored
    :returns: retrieved external events to the projection
    """
    try:
        with open(filename) as json_file:
            data = json.load(json_file)

        #print(data)
        extEvents = [str(elem['event'].strip()) for elem in data['externalEvents']]
        publicEvents = getRoleList(events)
        newExtEvents = []
        for elem in extEvents:
            if elem not in publicEvents:
                newExtEvents.append(elem)

        return newExtEvents
    except:
        return []


def addExternalEvents(cNames, chunks, filename):
    """
    retrieves external events and relations 

    :param cNames: choreography events
    :param chunks: projection decomposition
    :param filename: filename where projection data is stored
    :returns: retrieved external ids, event definitions, and involved relations
    """

    externalIds = []
    externalLinkages = []
    for line in chunks['linkages']:
        event1 = line.split()[0].strip()
        event2 = line.split()[2].strip()

        # if (event1 in cNames) and (event2 not in cNames):
        #    externalIds.append(event2)
        #    externalLinkages.append(line)
        if (event2 in cNames) and (event1 not in cNames):  # direct relation
            externalIds.append(event1)
            externalLinkages.append(line)

    externalEvents = []
    for _id in externalIds:
        for elem in chunks['internalEvents']:
            if elem not in externalEvents:
                if _id == elem.split('[')[0].replace(' ', '').strip():
                    externalEvents.append(elem)

    externalEvents = [getEventDeclarationFromName(
        elem, chunks) for elem in externalEvents]

    return externalIds, externalEvents, externalLinkages


def retrieveRelations(events, relations):
    """
    retrieves relations missing after a projection (events are chunked due to sender and receiver projections)

    :param events: list of choreography events
    :param relations: projection relations
    :returns: set of retrieved relations missed out due to projection
    """

    missingRelations = []
    events = getRoleList(events)
    for relation in relations:
        if ((getSender(relation) in events) and (getReceiver(relation) in events)):
            missingRelations.append(relation)

    return missingRelations


def generatePublicProjection(chunks, filename):
    """
    generates public projection out of dcr textual chunked representation

    :param chunks: dcr textual chunked representation
    :param filename: filename where projection will be stored
    :returns: public projection and list of external ids to the projection
    """

    # Extract choreography events and relations
    cNames = getRoleList(chunks['events'])
    
    choreoLinkages = filterOnChoreo(cNames, chunks['linkages'])
    
    # Add role external events to the public projection
    roleExternals = addRoleExternals(cNames, filename)
        
    public_events = roleExternals+cNames

    for elem in public_events:
        if('[' not in elem):
            for cEvent in chunks['events']:
                if (getRole(cEvent) == elem):
                    public_events[public_events.index(elem)] = cEvent

    public_relations = retrieveRelations(public_events, chunks['linkages'])

    # Look for external events
    externalIds, externalEvents, externalLinkages = addExternalEvents(
        public_events, chunks, filename)
    # Merge projection items
    tasks = getRoleList(public_events) + externalIds
    events = public_events + externalEvents

    linkages = public_relations + externalLinkages

    projGrouping = groupItems('Public', tasks)
    projection = ["##### Public Projection #######"] + \
        events + projGrouping + linkages

    # generate dict
    privateEvents = generateDictEvent(public_events, chunks['addresses'])
    externalEvents = generateDictEvent(externalEvents, chunks['addresses'])
    relations = generateDictRelation(linkages)

    try:
        with open(filename) as json_file:
            data = json.load(json_file)
    except:
        data={}
    data['public'] = {
        'privateEvents': privateEvents,
        'externalEvents': externalEvents,
        'relations': relations
    }

    #print(data['public'])

    with open(filename, 'w') as outfile:
        json.dump(data, outfile)

    return projection, externalIds


def projectPublic(processID, data, target):
    """
    generates public projection (text, cytoscape, and vector descriptions) out of a textual DCR description

    :param processID: the ID of the current process. eg: "p1"
    :param data: json description of the global dcr
    :param target: the path where the projection will be saved. eg: '../../client/src/projections/'
    """

    print('[INFO] Starting Public Projection')

    chunks, roles = extractChunks(data)

    # generate choreography projection
    projection, externalIds = generatePublicProjection(
        chunks.copy(), os.path.join(target, "dcrTexts.json"))
    generateGraph(processID, projection, externalIds, target, "Public")
    vectorize(projection, os.path.join(target, "temp_vectPublic"))
    # addFullMarkings(os.path.join(target,"vectChoreo"))

    print('[INFO] Public Projection generated')


# if __name__ == "__main__":
#    main()
