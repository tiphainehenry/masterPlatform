import os
import json
import glob
from datetime import datetime
from src.utils.chunking import getRoleMapping

"""
    Set of functions to manage dcr graph execution 
    ...

    Methods
    -------
    :retrieveMarkingOnId(markings, elem):  retrieves all markings belonging to elem id
    :retrieveMarkingOnName(markings, activity_name): retrieves all markings of elem name
    :initializeGraph(filename): initialize cytoscape data with initial markings
    :retrieveActivityRelations(relations, activity_id, dataProj): retrieves all relations involving elem name
    :preExecCheck(fromCondition, fromMilestone, markings): checks if an event is executable
    :postExecManager(toCondition, toInclude, toExclude, toRespond, markings): applies execution effect to projection events 
    :updCytoData(dataProj, markings): update cytoscape data projection with a new marking 
    :executeNode(execInfo): update cytoscape data projection with a new marking 
    :executeApprovedNode(processID, role, activity_name): updates projection after approved event execution
    :execLogg(roleID, processID, activity_name, status, start_timestamp, data): update log with new execution 

"""


def retrieveMarkingOnId(markings, elem):
    """
    retrieves all markings belonging to elem id

    :param markings: list of projection markings
    :param elem: event to analyze

    :returns: corresponding marking or []
    """

    id = elem['data']['id']
    for item in markings:
        if item['id'] == id:
            return item
    else:
        return []


def retrieveMarkingOnName(markings, activity_name):
    """
    retrieves all markings of elem name

    :param markings: list of projection markings
    :param activity_name: event name to analyze

    :returns: corresponding marking or []
    """

    for elem in markings:
        print(elem['id'])

        if elem['id'] == activity_name:
            return elem
    return False


def initializeGraph(filename):
    """
    initialize cytoscape data with initial markings

    :param filename: filename to analyze

    """

    with open(filename) as json_data:
        data = json.load(json_data)

    markings = data['markings']

    dataFilename = filename.replace('vect', 'data')
    with open(dataFilename) as json_data:
        dataProj = json.load(json_data)

    updProj = []
    for elem in dataProj:
        if elem['group'] == 'nodes':
            # filter out external events
            if (('classes' not in elem.keys()) or ('external' not in elem['classes'])):
                elemMarking = retrieveMarkingOnId(markings, elem)

                if(len(elemMarking) != 0):
                    if (elemMarking['include'] == 1):
                        elem.update({'classes': 'included executable'})

        updProj.append(elem)

    with open(os.path.join(dataFilename), 'w') as outfile:
        json.dump(updProj, outfile, indent=2)


def retrieveActivityRelations(relations, activity_id, dataProj):
    """
    retrieves all relations involving elem name

    :param relations: matrix relations of the projection
    :param activity_id: event name to analyze
    :param dataProj: projection data

    :returns: 
        :Json[] toCondition: list of conditions stemming out of activity_id with keys {'vectid','projid'}
        :Json[] fromCondition: list of conditions stemming towards activity_id with keys {'vectid','projid'}
        :Json[] fromMilestone: list of milestones stemming towards activity_id with keys {'vectid','projid'}
        :Json[] toInclude: list of include constraints stemming out of activity_id with keys {'vectid','projid'}
        :Json[] toExclude: list of exclude constraints stemming out of activity_id with keys {'vectid','projid'}
        :Json[] toRespond: list of response constraints stemming out of activity_id conditions with keys {'vectid','projid'}
    """
    print(relations)
    conditions = relations['condition']
    milestones = relations['milestone']
    responses = relations['response']
    excludes = relations['exclude']
    includes = relations['include']

    toCondition = []
    cnt = 0
    for elem in conditions[activity_id]:
        if elem == 1:
            toCondition.append({
                'vectid': cnt,
                'projid': dataProj[cnt]['data']['id']})

        cnt = cnt+1

    fromCondition = []
    cnt = 0
    for conditionFrom in conditions:
        print(conditionFrom)
        if conditionFrom[activity_id] == 1:
            fromCondition.append({
                'vectid': cnt,
                'projid': dataProj[cnt]['data']['id']})
        cnt = cnt + 1

    fromMilestone = []
    cnt = 0
    for milestoneFrom in milestones:
        if milestoneFrom[activity_id] == 1:
            fromMilestone.append({
                'vectid': cnt,
                'projid': dataProj[cnt]['data']['id']})
        cnt = cnt + 1

    toInclude = []
    cnt = 0
    for to_include in includes[activity_id]:
        if to_include == 1:
            toInclude.append({
                'vectid': cnt,
                'projid': dataProj[cnt]['data']['id']})
        cnt = cnt + 1

    toExclude = []
    cnt = 0
    for to_exclude in excludes[activity_id]:
        if to_exclude == 1:
            toExclude.append({
                'vectid': cnt,
                'projid': dataProj[cnt]['data']['id'].replace("u'", "").replace("'", "")})
        cnt = cnt + 1

    toRespond = []
    cnt = 0
    for to_resp in responses[activity_id]:
        if to_resp == 1:
            toRespond.append({
                'vectid': cnt,
                'projid': dataProj[cnt]['data']['id']})
        cnt = cnt + 1

    """
    print('From Conditions:')
    print(fromCondition)
    print('To Conditions:')
    print(toCondition)
    print('Milestones:')
    print(fromMilestone)
    print('Include:')
    print(toInclude)
    print('Exclude:')
    print(toExclude)
    print('Responses:')
    print(toRespond)
    """
    return toCondition, fromCondition, fromMilestone, toInclude, toExclude, toRespond


def preExecCheck(fromCondition, fromMilestone, markings):
    """
    checks if an event is executable

    :param Json[] fromCondition: list of conditions stemming towards activity_id with keys {'vectid','projid'}
    :param Json[] fromMilestone: list of milestones stemming towards activity_id with keys {'vectid','projid'}
    :param str[] markings: markings of the projection to analyze

    :returns: a boolean > true: executable, false: not executable
    """

    # if conditions not empty: get markings of conditions --> if not executed yet and included: error
    if (len(fromCondition) != 0):
        for elem in fromCondition:
            if (retrieveMarkingOnName(markings, elem['projid'])['executed'] == 0) and (retrieveMarkingOnName(markings, elem)['include'] == 1):
                print('[INFO] error - elem condition not executed')
                return False

    # if milestones not empty --> similar behavior
    if (len(fromMilestone) != 0):
        for elem in fromMilestone:
            if (retrieveMarkingOnName(markings, elem['projid'])['executed'] == 0) and (retrieveMarkingOnName(markings, elem)['include'] == 1):
                print('[INFO] error - elem milestone not executed')
                return False

    return True


def postExecManager(toCondition, toInclude, toExclude, toRespond, markings):
    """
    applies execution effect to projection events 

    :param toCondition: list of conditions stemming out of activity_id with keys {'vectid','projid'}
    :param toInclude: list of include constraints stemming out of activity_id with keys {'vectid','projid'}
    :param toExclude: list of exclude constraints stemming out of activity_id with keys {'vectid','projid'}
    :param toRespond: list of response constraints stemming out of activity_id conditions with keys {'vectid','projid'}
    :param markings: markings of the projection to analyze

    :returns: updated markings of the projection
    """

    if(len(toInclude) != 0):
        for elem in toInclude:
            retrieveMarkingOnName(markings, elem['projid'])['include'] = 1

    if(len(toCondition) != 0):
        for elem in toCondition:
            retrieveMarkingOnName(markings, elem['projid'])['include'] = 1

    if(len(toExclude) != 0):
        for elem in toExclude:
            retrieveMarkingOnName(markings, elem['projid'])['include'] = 0

    if(len(toRespond) != 0):
        for elem in toRespond:
            retrieveMarkingOnName(markings, elem['projid'])['pending'] = 1
            retrieveMarkingOnName(markings, elem['projid'])['include'] = 1

    return markings


def updCytoData(dataProj, markings):
    """
    update cytoscape data projection with a new marking 

    :param Json[] dataProj: cytoscape node description
    :param str[] markings: markings of the projection to analyze

    :returns: updated cytoscape node description
    """

    for elem in dataProj:
        if(elem['group'] == 'nodes'):
            if ('classes' in elem.keys()) and ('external' in elem['classes']):
                pass
            else:
                classes = []

                if retrieveMarkingOnId(markings, elem)['include'] == 1:
                    classes.append('included  executable')
                if retrieveMarkingOnId(markings, elem)['executed'] == 1:
                    classes.append('executed')
                if retrieveMarkingOnId(markings, elem)['pending'] == 1:
                    classes.append('pending executable')
                elem.update({'classes': ' '.join(classes)})

    return dataProj


def executeNode(execInfo):
    """
    update cytoscape data projection with a new marking 

    :param Json execInfo: execution request to process

    :returns: execution status (rejected request or success)
    """

    projId = execInfo['projId']
    activity_name = execInfo['idClicked']
    processID = execInfo['processID']

    # check if not a receive choreography event:
    if (activity_name[0] == 'e') and (activity_name[1].isdigit()) and (activity_name[-1] == 'r'):
        return 'rejected - receive choreography event'

    status = 'waiting'
    # retrieve activity data

    roleMapping = getRoleMapping(processID, projId)

    dbPath = '../../client/src/projections/DCR_Projections.json'
    with open(dbPath) as json_data:
        DCRdb = json.load(json_data)

    dataProj = DCRdb[processID][roleMapping['id']]['data']
    dataVect = DCRdb[processID][roleMapping['id']]['vect']

    # check if not external event
    activity_id = 0
    for elem in dataProj:
        if((dataProj[activity_id]['group']=='nodes')& (dataProj[activity_id]['data']['id'] != activity_name)):
            activity_id = activity_id+1
    if 'external' in dataProj[activity_id]['classes']:
        return 'rejected - external event'

    # retrieve markings activity_name and check inclusion:
    markings = dataVect['markings']
    activity_marking = retrieveMarkingOnName(markings, activity_name)
    if activity_marking['include'] != 1:
        print('[INFO] error - elem not included')
        return 'rejected - not included'

    else:
        print('[INFO] success - elem included')
        # retrieve activity relations (conditions, milestones, included, excluded, response)
        relations = dataVect['relations'][0]
        toCondition, fromCondition, fromMilestone, toInclude, toExclude, toRespond = retrieveActivityRelations(relations,
                                                                                                               activity_id, dataProj)

        # pre_execution evaluation
        status = preExecCheck(fromCondition, fromMilestone, markings)
        if not status:
            return 'throw error - prexec conditions not executed'

        # retrieve semiinternal events
        publicInfos = DCRdb[processID]['Public']['vect']
        publicEvents = publicInfos['activityNames']['default'] + \
            publicInfos['activityNames']['send'] + \
            publicInfos['activityNames']['receive']

        # execution
        if activity_name in publicEvents:
            # execute event onChain
            return 'BC exec'

        else:  # local update
            # Update markings:
            activity_marking['executed'] = 1
            activity_marking['pending'] = 0

            # post_execution evaluation  --> upd markings included, excluded, response
            markings = postExecManager(
                toCondition, toInclude, toExclude, toRespond, markings)

            # update projData classes and rewrite
            updProj = updCytoData(dataProj, markings)

            with open(dbPath, 'w') as outfile:
                json.dump(DCRdb, outfile, indent=2)

            return 'executed'


def executeApprovedNode(processID, role, activity_name):
    """
    updates projection after approved event execution 
    step 1. update marking to true
    step 2. apply post exec function

    :param processID: process ID
    :param role: projection ID
    :param activity_name: activity named whose execution is approved

    """
    # retrieve activity data
    dbPath = './client/src/projections/DCR_Projections.json'
    with open(dbPath) as json_data:
        DCRdb = json.load(json_data)

    roleMapping = getRoleMapping(processID, role)

    dataProj = DCRdb[processID][roleMapping['id']]['data']
    dataVect = DCRdb[processID][roleMapping['id']]['vect']

    # retrieve markings activity_name:
    markings = dataVect['markings']
    activity_marking = retrieveMarkingOnName(markings, activity_name)

    # retrieve activity relations (conditions, milestones, included, excluded, response)
    activity_id = 0
    while((dataProj[activity_id]['data']['id'] != activity_name) and (activity_id < len(dataProj))):
        activity_id = activity_id+1
        if activity_id == len(dataProj):
            return 'activity not found'  # append status to execlog (?)

    relations = dataVect['relations'][0]
    toCondition, fromCondition, fromMilestone, toInclude, toExclude, toRespond = retrieveActivityRelations(relations,
                                                                                                           activity_id, dataProj)

    # execution
    # Update markings:
    activity_marking['executed'] = 1
    activity_marking['pending'] = 0

    # post_execution evaluation  --> upd markings included, excluded, response
    markings = postExecManager(
        toCondition, toInclude, toExclude, toRespond, markings)

    # update projData classes and rewrite data and vect
    updProj = updCytoData(dataProj, markings)
    with open(dbPath, 'w') as outfile:
        json.dump(DCRdb, outfile, indent=2)

    return 'executed'  # append status to execlog (?)


def execLogg(roleID, processID, activity_name, status, start_timestamp, data):
    """
    update log with new execution 

    :param roleID: projection ID
    :param processID: process ID
    :param activity_name: activity name processed
    :param status: exec status
    :param start_timestamp: exec timestamp
    :param data: user txt input (if any)
     
    :returns: updated cytoscape node description
    """

    dbPath = '../../client/src/projections/DCR_Projections.json'
    with open(dbPath) as json_data:
        DCRdb = json.load(json_data)

    if(roleID == 'Public'):
        execData = DCRdb[processID]['Public']['exec']
    else:
        roleMapping = getRoleMapping(processID, roleID)
        execData = DCRdb[processID][roleMapping['id']]['exec']

    now = datetime.now()
    date_time = now.strftime("%m/%d/%Y, %H:%M:%S")

    id = len(execData['execLogs'])
    execData['execLogs'].append({
        'id': id,
        'task': activity_name,
        'status': status,
        'timestamp_startTask': start_timestamp,
        'timestamp_endTask': date_time,
        'data': data
    })

    with open(dbPath, 'w') as outfile:
        json.dump(DCRdb, outfile, indent=2)
