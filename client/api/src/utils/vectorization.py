# -*- coding: utf-8 -*-
 
import os
import argparse
import sys
import pathlib
import json
import numpy as np
import json

from src.utils.formatting import getFileName, NumpyEncoder, getRoleList
from src.utils.chunking import extractChunks, extractRoleChunks
from src.utils.graphManager import initializeGraph


"""
    Set of functions to vectorize a dcr graph  
    ...

    Methods
    -------
    :getRelationElems(relation): decomposes relation into json format
    :getEventId(event): returns event ID
    :generateRelationMatrix(relationType, eventsList, relations): generates relation matrix out of a set of relations
    :generateRelationMatrices(chunks): generates all 5 relation matrices (condition, response, milestone, include, exclude) out of a set of relations
    :generateInitialMarking(eventsList, events, relations): generates initial markings of a projection
    :generateInitialMarkings(chunks): generates list of initial markings out of a chunked representation
    :computeActivityNames(activities): computes list of activity names with different projection settings (ie default choreography names, or send/receive projected choreography names)
    :addFullMarkings(markings): computes activity name variants, and list of markings of the projection
    :vectorize(data, filename): vectorizes the textual description of the global dcr graph (markings and relation matrices)
    :vectorizeRole(data, filename):vectorizes the textual description of the projected dcr graphs (markings and relation matrices)
    :vectorizeRoleFromCyto(data, filename): vectorizes the cytoscape representation of the projected dcr graph
"""


def getRelationElems(relation):
    """     decomposes relation into json format

    :param relation: relation to decompose
    :returns: json representation of the relation, with keys {r_type,r_from,r_to}
    """

    typeID = 0
    id_from = relation.split()[0]
    id_to = relation.split()[-1]

    if '<>' in relation:
        typeID = 'milestone'
    elif '>*' in relation:
        typeID = 'condition'
    elif '*-' in relation:
        typeID = 'response'
    elif '+' in relation:
        typeID = 'include'
    elif '%' in relation:
        typeID = 'exclude'
    else:
        typeID = 0  # no relation, wrong input (error to raise)

    relationElems = {
        'r_type': typeID,
        'r_from': id_from,
        'r_to': id_to
    }
    return relationElems


def getEventId(event):
    """     returns event ID

    :param event: event declaration
    :returns: event id (eg e1 if choreography event, or Driver, Florist, etc if local event)
    """

    return event.split('[')[0].strip()


def generateRelationMatrix(relationType, eventsList, relations):
    """     generates relation matrix out of a set of relations

    :param relationType: matrix type to generate
    :param eventsList: list of events
    :param relations: list of relations
    :returns: relation matrix of size NxN where N=number of events, and list of markings
    """

    relationMatrix = np.zeros((len(eventsList), len(eventsList)))

    # filter set of relations with relation type
    relationList = []
    for relation in relations:
        r_elems = getRelationElems(relation)
        if relationType == r_elems['r_type']:
            relationList.append(r_elems)

    # update matrix
    #print("toto")
    #print(relationList)
    #print(eventsList)
    for relation in relationList:
        #print("pppp")
        #print(relation)
        relationMatrix[eventsList.index(
            relation['r_from'])][eventsList.index(relation['r_to'])] = 1

    fullMatrix = []
    listRelation = relationMatrix.tolist()

    for elem in listRelation:
        newLine = []
        for item in elem:
            newLine.append(str(item).replace('.0', ''))
        fullMatrix.append(newLine)

    return relationMatrix, fullMatrix


def generateRelationMatrices(chunks):
    """    generates all 5 relation matrices (condition, response, milestone, include, exclude) out of a set of relations

    :param chunks: chunked representation of the projection
    :returns: relation matrices of size NxN where N=number of events, and list of all relation matrices
    """

    #print('[INFO] Generating Relation Matrices')

    relations = chunks['linkages']
    events = chunks['events'] + chunks['internalEvents']

    if relations == []:
        return [], [0, 0, 0, 0, 0]
    else:
        # get list of events
        eventsList = getRoleList(events)

        rc, rfc = generateRelationMatrix('condition', eventsList, relations)
        rm, rfm = generateRelationMatrix('milestone', eventsList, relations)
        rr, rfr = generateRelationMatrix('response', eventsList, relations)
        ri, rfi = generateRelationMatrix('include', eventsList, relations)
        re, rfe = generateRelationMatrix('exclude', eventsList, relations)

        relationMatrices = [
            {
                'condition': rc,
                'milestone': rm,
                'response': rr,
                'include':  ri,
                'exclude':  re,
            }
        ]

        fullRelations = [rfi, rfe, rfr, rfc, rfm]
        return relationMatrices, fullRelations


def generateInitialMarking(eventsList, events, relations):
    """     generates initial markings of a projection. Executed and pending markings are set to zero.

    :param eventsList: list of event ids
    :param events: list of projection events
    :param relations: list of relations
    :returns: list of event markings where each marking is a dict with keys {id, include, executed, pending}
    """

    m2 = []
    # Get all included elems ==> get list of events without from activities

    # step1: extract to events
    to_events = []
    for r in relations:
        elem = getRelationElems(r)['r_to']
        if elem not in to_events:
            to_events.append(elem)

    # step2: filter on events without to elem
    for event in eventsList:
        include = 0
        if event not in to_events:
            include = 1
            # m_Matrix[eventsList.index(event)] = 1  # update their id to 1

        m2.append({'id': event, 'include': include,
                   'executed': 0, 'pending': 0})

    return m2  # m_Matrix


def generateInitialMarkings(chunks):
    """     generates list of initial markings out of a chunked representation

    :param chunks: chunked decomposition of the projection
    :returns: list of event markings where each marking is a dict with keys {id, include, executed, pending}
    """

    #print('[INFO] Generating Initial Markings')

    relations = chunks['linkages']
    events = chunks['events'] + chunks['internalEvents']

    # get list of events
    eventsList = []
    for event in events:
        eventsList.append(getEventId(event))

    # generate markings
    markingMatrices = generateInitialMarking(eventsList, events, relations)

    return markingMatrices


def computeActivityNames(activities):
    """  computes list of activity names with different projection settings (ie default choreography names, or send/receive projected choreography names)

    :param activities: list of initial activities
    :returns: dict of activity names variants (default, send, or receive views)
    """

    send = []
    receive = []

    for elem in activities:
        if(elem[0] == 'e'):
            send.append(elem+'s')
            receive.append(elem+'r')
        else:
            send.append(elem)
            receive.append(elem)

    return {
        'default': activities,
        'send': send,
        'receive': receive
    }


def addFullMarkings(markings):
    """ computes activity name variants, and list of markings of the projection

    :param markings: list of initial markings with event names
    :returns: variants of activity names, and full markings
    """

    # add activitynames
    activitynames = []
    included = []
    executed = []
    pending = []
    for elem in markings:
        if(elem['id'] not in activitynames):
            activitynames.append(elem['id'])
            included.append(str(elem['include']))
            executed.append(str(elem['executed']))
            pending.append(str(elem['pending']))

    # fullMarkings = [''.join(included),''.join(executed),''.join(pending)]
    fullMarkings = [included, executed, pending]

    return computeActivityNames(activitynames), fullMarkings


def vectorize(data, filename):
    """
    vectorizes the textual description of the global dcr graph (markings and relation matrices)

    :param data: textual description of the global dcr graph
    :param filename: filename to save vectorization

    """
    #print("test")
    #print(data)
    chunks, roles = extractChunks(data)

    relations, fullRelations = generateRelationMatrices(chunks)

    markings = generateInitialMarkings(chunks)
    activitynames, fullMarkings = addFullMarkings(markings)

    bitvectors = {
        'relations': relations,
        'markings': markings,
        'activityNames': activitynames,
        'fullMarkings': {
            'included': fullMarkings[0],
            'executed': fullMarkings[1],
            'pending':  fullMarkings[2]
        },
        'fullRelations': {
            'include':   fullRelations[0],
            'exclude':   fullRelations[1],
            'response':  fullRelations[2],
            'condition': fullRelations[3],
            'milestone': fullRelations[4]
        }
    }

    path = filename+'.json'
    with open(path, 'w') as outfile:
        json.dump(bitvectors, outfile, indent=2, cls=NumpyEncoder)

    initializeGraph(path)


def vectorizeRole(data, filename):
    """
    vectorizes the textual description of the projected dcr graphs (markings and relation matrices)

    :param data: textual description of the role dcr graphs
    :param filename: filename to save vectorizations

    """

    chunks = extractRoleChunks(data)

    rel, fullrel = generateRelationMatrices(chunks)
    bitvectors = {
        'relations': rel,
        'markings': generateInitialMarkings(chunks)
    }
    path = filename+'.json'

    with open(path, 'w') as outfile:
        json.dump(bitvectors, outfile, indent=2, cls=NumpyEncoder)

    initializeGraph(path)


def vectorizeRoleFromCyto(processID, roleID, data):
    """
    vectorizes the cytoscape representation of the projected dcr graph.
    First: generates all relation matrices, and then the markings.
    :param data: cytoscape description of the role dcr graphs
    :param filename: filename to save vectorizations
    """

    #print(data)
    nodes=[]
    edges=[]
    for elem in data:
        if(elem['group']=='nodes'):
            nodes.append(elem)
        else:
            edges.append(elem)

    eventsList = [elem['data']['id'] for elem in nodes]

    #RELATION MATRICES
    rel_matrices = {}
    rel_types = ['condition','response','include','exclude','milestone']
    for relation_type in rel_types:
        relationMatrix = np.zeros((len(nodes), len(nodes)))

        # filter set of relations with relation type
        relationList = []
        for relation in edges:
            if (relation_type in relation['classes']):
                relationList.append(relation)    
        # update matrix
        for relation in relationList:
            relationMatrix[eventsList.index(
                relation['data']['source'])][eventsList.index(relation['data']['target'])] = 1

        # convert np array to list
        relationMatrix2List = relationMatrix.tolist()
        # update list of matrices
        rel_matrices[relation_type] = relationMatrix2List

    #display relation matrices:
    #for rel in ['condition','response','include','exclude','milestone']:
       #print(rel)
    #    for elem in rel_matrices[rel]:
           #print(elem)

    #MARKINGS:
    markings = []
    # get list of events without from activities ==> get all included events

    # step1: extract to events
    to_events = []
    for relation in edges:
        elem = relation['data']['target']
        if elem not in to_events:
            to_events.append(elem)

    # step2: filter on events without to elem
    for event in eventsList:
        include = 0
        if event not in to_events:
            include = 1
        markings.append({'id': event, 'include': include,
                   'executed': 0, 'pending': 0})

    bitvectors = {
        'relations': [rel_matrices],
        'markings': markings,
        'activityNames':{
            "default":eventsList
        }
    }
        
    return bitvectors