import os
import pathlib
import argparse
import sys
import json 
import numpy as np

from src.utils.formatting import cleanName, getFileName, groupItems, getRoleTenant, getSender, getReceiver, getRole, getArrowLink, getChoreographyDetails, getType, getRoleList,generateDictEvent,generateDictRelation
from src.utils.chunking import extractChunks, getLinkages,applyComposition, getRoles, getRoleMapping
from src.utils.vectorization import vectorizeRole
from src.utils.graphDataTranslator import generateGraph

"""
    Set of functions to translate a text dcr graph description into a json view, a cytoscape view, and a vectorized view 
    ...

    Methods
    -------
    :getRoleEvents(role, choreoEvents, internalEvents): extracts generates text projection out of a global DCR description
    :filterOnRoles(linkages, projRefs): extracts all relations linking a set of tenants 
    :generateDCRText(processID, chunks, role, choreoEventsProj, filename): generates text projection out of a global DCR description
    :projRole(processID, data, target, role): generates role projection (text, cytoscape, and vector descriptions) out of a global DCR description

"""


def getRoleEvents(role, choreoEvents, internalEvents):
    """
    extracts generates text projection out of a global DCR description

    :param role: the role of interest. eg: 'Driver'
    :param choreoEvents: list of choreography events of the global projection
    :param internalEvents: list of internal events of the global projection
    :returns: the list of events where role is involved, and the list of tenants linked to role
    """ 

    projEvents = ["## Event Declaration ##"]
    projRefs = []

    for elem in choreoEvents:
        eventName, task, src, tgts = getChoreographyDetails(elem)

        involvedTenants = [str(src)]
        if(' ' in tgts):
            tgts = tgts.split(' ')
            involvedTenants=involvedTenants+tgts
        else:
            involvedTenants.append(tgts)

        if role in involvedTenants:
                newEvent = elem        
                if src == role:
                    newEvent = eventName+'s["!('+ str(task) +', '+ str(src) + '-&gt;'+str(tgts)+')"]'
                    projRefs.append(eventName+'s')  
                elif role in tgts:
                    newEvent = eventName+'r["?('+ str(task) +', '+ str(src) + '-&gt;'+role+')"]'
                    projRefs.append(eventName+'r')  
                else:
                    projRefs.append(elem)

                projEvents.append(newEvent)

    for line in internalEvents:
        if role == getRoleTenant(line):
            projEvents.append(line.strip())   
            projRefs.append(getRole(line))

    #projGrouping = groupItems(role, projRefs)
    return projEvents, projRefs


def filterOnRoles(linkages, projRefs):
    """
    extracts all relations linking a set of tenants

    :param linkages: list of relations of the global projection
    :param projRefs: list of tenants to filter
    :returns: str[], the list of relations linked to the set of tenants
    """ 

    # filter on events
    roleLinkages = []
    for line in linkages:
        if (getSender(line) in projRefs) and (getReceiver(line) in projRefs):
            roleLinkages.append(line)
                
    if len(roleLinkages)==0:
        roleLinkages = ["#--> None Matching - Manual implementation required"]

    return ["\n## Linkages ##"] + roleLinkages #+ ["\n## WrongLinks ##"] + wrongLinks


def generateDCRTextLocal(processID, role_id, chunks, role, choreoEventsProj, filename):
    """
    generates text projection out of a global DCR description

    :param processID: the ID of the current process. eg: "p1"
    :param chunks: json description of the global dcr
    :param role: the role to project. eg: 'Driver'
    :param filename: the file name to be saved
    :returns: the projection for the role externalIds, and the list of external ids for the role
    """ 

    # get simple role projection
    projEvents, projRefs = getRoleEvents(role, chunks['events'], chunks['internalEvents']) ## 
    rawLinkages = getLinkages(projRefs, chunks['linkages']) 
    updatedLinkages = filterOnRoles(rawLinkages, projRefs) ## checked
    # apply composition algo
    externalIds, externalEvents, externalLinkages = applyComposition(projRefs, updatedLinkages, chunks)
    # Merge projection items
    tasks = projRefs + externalIds
    events = projEvents + externalEvents
    linkages = updatedLinkages + externalLinkages

    #linkages = updatedLinkages 
    projGrouping = groupItems(role, tasks)
    projection = ["##### Projection over role [" + role + "] #######"] + events + projGrouping + linkages 

    #generate dict
    Pev=generateDictEvent(projEvents,chunks['addresses'])
    Eev=generateDictEvent(externalEvents,chunks['addresses'])
    relations=generateDictRelation(linkages)

    try:
        with open(filename) as json_file:
            data = json.load(json_file)

    except:
        data={}

    data[role_id]={
            'role':role,
            'privateEvents':Pev,
            'externalEvents':Eev,
            'relations':relations
        }

    #print(data.keys())

    try:
        extDict=data['externalEvents']
        extDictElems=[elem['event'] for elem in extDict]
        for elem in Eev:
            if elem['event'] not in extDictElems:
                extDict.append(elem)
        data['externalEvents']=extDict

    except:
        data['externalEvents']=[]

    with open(filename, 'w') as outfile:
            json.dump(data, outfile)
    return projection, externalIds

def generateDCRText(processID, chunks, role, choreoEventsProj, filename):
    """
    generates text projection out of a global DCR description

    :param processID: the ID of the current process. eg: "p1"
    :param chunks: json description of the global dcr
    :param role: the role to project. eg: 'Driver'
    :param filename: the file name to be saved
    :returns: the projection for the role externalIds, and the list of external ids for the role
    """ 

    # get simple role projection
    projEvents, projRefs = getRoleEvents(role, chunks['events'], chunks['internalEvents']) ## 
    rawLinkages = getLinkages(projRefs, chunks['linkages']) 
    updatedLinkages = filterOnRoles(rawLinkages, projRefs) ## checked
    # apply composition algo
    externalIds, externalEvents, externalLinkages = applyComposition(projRefs, updatedLinkages, chunks)
    # Merge projection items
    tasks = projRefs + externalIds
    events = projEvents + externalEvents
    linkages = updatedLinkages + externalLinkages

    #linkages = updatedLinkages 
    projGrouping = groupItems(role, tasks)
    projection = ["##### Projection over role [" + role + "] #######"] + events + projGrouping + linkages 

    #generate dict
    Pev=generateDictEvent(projEvents,chunks['addresses'])
    Eev=generateDictEvent(externalEvents,chunks['addresses'])
    relations=generateDictRelation(linkages)
    
    with open(filename) as json_file:
        data = json.load(json_file)
            
    role_id=getRoleMapping(processID, role)['id']
    data[role_id]={
            'role':role,
            'privateEvents':Pev,
            'externalEvents':Eev,
            'relations':relations
        }


    extDict=data['externalEvents']
    extDictElems=[elem['event'] for elem in extDict]

    for elem in Eev:
        if elem['event'] not in extDictElems:
            extDict.append(elem)
    data['externalEvents']=extDict


    with open(filename, 'w') as outfile:
            json.dump(data, outfile)
    return projection, externalIds


def projRole(processID, data, target, role):       
    """
    generates role projection (text, cytoscape, and vector descriptions) out of a global DCR description

    :param processID: the ID of the current process. eg: "p1"
    :param data: json description of the global dcr
    :param target: the path where the projection will be saved. eg: '../../client/src/projections/'
    :param role: the role to project. eg: 'Driver'
    """ 
    chunks, roles = extractChunks(data)

    choreoEventsProj = []
    for line in chunks['events']:
        eventName, task, src, tgts = getChoreographyDetails(line)         
        if src == role:
            newEvent = eventName+'s["!('+ str(task) +', '+ str(src) + '-&gt;'+str(tgts)+')"]'
            choreoEventsProj.append(newEvent)
        elif role in tgts:
            newEvent = eventName+'r["?('+ str(task) +', '+ str(src) + '-&gt;'+role+')"]'
            choreoEventsProj.append(newEvent)
        else:
            pass

    roleMapping=getRoleMapping(processID, role)
    projection, externalIds = generateDCRText(processID, chunks, role, choreoEventsProj, os.path.join(target,"dcrTexts.json"))            
    generateGraph(processID, projection, externalIds, target, role)

    #print("[DEBUG] Vectorizing"+ role)
    vectorizeRole(projection, os.path.join(target,"temp_vect"+roleMapping['id']))

    print('[INFO] Projection of role '+role+' generated')

    
def projRole_fromLocalRequest(processID, data, target, role, roleID):       
    """
    generates role projection (text, cytoscape, and vector descriptions) out of a LOCAL DCR description

    :param processID: the ID of the current process. eg: "p1"
    :param data: json description of the global dcr
    :param target: the path where the projection will be saved. eg: '../../client/src/projections/'
    :param role: the role to project. eg: 'Driver'
    """ 
    chunks, roles = extractChunks(data)

    #print(chunks)
    choreoEventsProj = []   

    for line in chunks['events']:
        eventName, task, src, tgts = getChoreographyDetails(line)         
        if src == role:
            newEvent = eventName+'s["!('+ str(task) +', '+ str(src) + '-&gt;'+str(tgts)+')"]'
            choreoEventsProj.append(newEvent)
        elif role in tgts:
            newEvent = eventName+'r["?('+ str(task) +', '+ str(src) + '-&gt;'+role+')"]'
            choreoEventsProj.append(newEvent)
        else:
            pass
    
    roleMapping=getRoleMapping(processID, role)
    projection, externalIds = generateDCRTextLocal(processID, roleID, chunks, role, choreoEventsProj, os.path.join(target,"temp_local.json"))    

    generateGraph(processID, projection, externalIds, target, role)

    #print("[DEBUG] Vectorizing"+ role)
    vectorizeRole(projection, os.path.join(target,"temp_vect"+roleMapping['id']))

    print('[INFO] LOCAL projection of role '+role+' generated')

