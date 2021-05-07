import json
import os
from src.utils.chunking import getRoleMapping

"""
    Set of functions to translate a dcr representation into cytoscape.js elements 
    ...

    Methods
    -------
    :extractGroupRelations(groupings, linkages): remove groups from set of relations  
    :extractChunks(data): decomposes global dcr textual description into choreography, local events, and relations.
    :extractRoleChunks(data): decomposes role dcr textual description into choreography, local events, and relations.
    :getRelationElems(relation): decomposes a relation description into a triplet type, src, tgt.
    :bodyInternal(event, num_task, externalIds): decomposes a local event into a cytoscape node description.
    :bodyExternal(event, num_task, externalIds): decomposes an external event into a cytoscape node description.
    :bodyChoreo(event, num_task, externalIds): decomposes a choreography event into a cytoscape node description.
    :getEventElems(event, numTask, externalIds): decomposes an event into a cytoscape node description (whether choreography, external, or internal).
    :cytoTasks(events, externalIds): retrieves the cytoscape node description of a set of events
    :cytoEdges(edges): retrieves the cytoscape edge description of a set of relations 
    :generateGraph(pi, data, externalIds, target, role): computes the cytoscape description of a set of a dcr graph (events and relations) and saves it to target file.

"""


def extractGroupRelations(groupings, linkages):
    """
    remove groups from set of relations  

    :param groupings: list of group descriptions to remove (usually 'Group groupName {e1 e2 e3}')
    :param linkages: list of relations to analyze
    :returns: updated relations
    """

    # clean list
    count = 0
    for line in linkages:
        spl = line.split()
        if len(spl) > 3:
            if '"' in spl[0] and spl[1]:
                newLine = spl[0]+spl[1] + ' '+' '.join(spl[2:])
                linkages[count] = newLine.replace('"', '')

            if '"' in spl[-1] and spl[-2]:
                newLine = ' '.join(spl[0:2]) + ' ' + spl[-2]+spl[-1]
                linkages[count] = newLine.replace('"', '')
        count = count + 1

    # verify if group expends on several lines: create grouping dict
    for group in groupings:
        if group.strip()[0] == '#':
            pass
        else:
            # extract group name
            groupName = group.split('Group')[1].split(
                '{')[0].strip().replace(' ', '').replace('"', '')
            # extract relations included in grouping
            groupRelations = group.split('Group')[1].split(
                '{')[1].replace('}', '').split()
            # clean group
            cnt = 0
            for elem in groupRelations:
                if (groupRelations[cnt][0] == '"') and (groupRelations[cnt+1][-1] == '"'):
                    groupRelations[cnt] = groupRelations[cnt] + \
                        groupRelations[cnt+1]
                    groupRelations.remove(groupRelations[cnt+1])
                cnt = cnt+1

            # extract relations to duplicate
            toDuplicate = []
            for link in linkages:
                if (groupName in link) and ('-' in link):
                    toDuplicate.append(link)

            # extract first and last relations of grouping (ie 'no from' or 'no to' task)
            firstRelation = None
            lastRelation = None
            for elem in groupRelations:
                hasFirst = False
                hasLast = False

                for link in linkages:
                    if elem in link.split()[0]:
                        hasLast = True
                    elif elem in link.split()[-1]:
                        hasFirst = True

                if not hasFirst:
                    firstRelation = elem
                elif not hasLast:
                    lastRelation = elem
                else:
                    pass

            # regenerate relations according to the type
            for relation in toDuplicate:
                chunks = relation.split()
                if groupName in chunks:
                    if groupName == chunks[0].strip():
                        duplicatedRelation = firstRelation + \
                            ' ' + ' '.join(chunks[1:])
                    else:  # groupName == chunks[-1].strip():
                        duplicatedRelation = ' '.join(
                            chunks[:-1]) + ' ' + lastRelation
                    linkages.append(duplicatedRelation)
                else:
                    pass

    return linkages


def extractChunks(data):
    """
    decomposes dcr textual description into choreography, local events, and relations.

    :param data: dcr description
    :returns: dictionary of the dcr description with keys {events (ie choreographies), internalEvents (ie local events), linkages (ie relations)}, and list of roles
    """

    events, internalEvents = [], []
    groupings, linkages = [], []
    roles = []
    #misc = []

    for line in data:
        if (line[0] == 'e') and ((line[2] == '[') or (line[3] == '[')):
            lineclean = line.replace('= ', '=').replace(
                ' =', '=').replace(' = ', '=')
            events.append(lineclean)
            for elem in line.split(' '):
                if ('src' in elem) or ('tgt' in elem):
                    elemclean = elem.strip().replace('tgt=', '').replace('src=', '').replace(']', '')
                    if elemclean != '' and (elemclean not in roles):
                        roles.append(elemclean)
        elif 'Group' in line and line[0] != '#':
            groupings.append(line)
        elif '->' in line:
            linkages.append(line.strip())
        elif ('role=' in line) and ('#' not in line):
            nameChunk = line.split()
            role = nameChunk.pop()
            name = ''.join(nameChunk).replace('"', '')
            cleanedInternalEvent = name+' ' + role
            internalEvents.append(cleanedInternalEvent)
        else:
            pass
            # misc.append(line)

        for i in range(0, len(linkages)):
            if (linkages[i][0] == '#'):
                linkages.remove(linkages[i])

    linkages = extractGroupRelations(groupings, linkages)

    chunks = {
        'events': events,
        'internalEvents': internalEvents,
        'linkages': linkages,
    }
    return chunks, roles


def extractRoleChunks(data):
    """
    decomposes dcr textual description into choreography, local events, and relations.

    :param data: dcr description
    :returns: dictionary of the dcr description with keys {events (ie choreographies), internalEvents (ie local events), linkages (ie relations)}, and list of roles
    """

    events, internalEvents = [], []
    groupings, linkages = [], []
    roles = []
    #misc = []

    for line in data:

        if ((line[0] != '#') & (line[0:8] != 'pk[role=')):

            if 'role' in line:
                internalEvents.append(line)
            elif ('src=' in line) or ('?' in line) or ('!' in line):
                events.append(line)
            elif ('-' in line) and ('>' in line):
                linkages.append(line)

        for i in range(0, len(linkages)):
            if (linkages[i][0] == '#'):
                linkages.remove(linkages[i])

    chunks = {
        'events': events,
        'internalEvents': internalEvents,
        'linkages': linkages,
    }

    return chunks


def getRelationElems(relation):
    """
    decomposes a relation description into a triplet type, src, tgt.

    :param relation: relation description    
    :returns: dictionary of the relation decomposition with keys {r_type, r_from, r_to}
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


def bodyInternal(event, num_task, externalIds):
    """
    decomposes a local event into a cytoscape node description.

    :param event: event to decompose
    :param num_task: number of the task to plot the node into the graph (not in use) 
    :param externalIds: list of external events of the projection    
    :returns: dictionary description of the node event according to cytoscape js syntax
    """

    _id = event.split('[')[0].strip()
    src = event.split('role=')[1].replace(']', '').strip()
    tgt = ''
    tsk = _id

    if _id in externalIds:
        body = {
            'data': {
                'id': _id,
                'name': src+"\n"+tsk
            },
            # 'position': { "x": num_task*100, "y": 100},
            'group': "nodes",
            'classes': "external type_internal"
        }
    else:
        body = {
            'data': {
                'id': _id,
                'name': src+"\n"+tsk
            },
            # 'position': { "x": num_task*100, "y": 100},
            'group': "nodes"
        }

    return body


def bodyExternal(event, num_task, externalIds):
    """
    decomposes an external event into a cytoscape node description.

    :param event: external event to decompose
    :param num_task: number of the task to plot the node into the graph (not in use) 
    :param externalIds: list of external events of the projection
    
    :returns: dictionary description of the node event according to cytoscape js syntax
    """

    # done for -&gt;
    _id = event.split('[')[0]
    src = event.split(',')[1].split('-')[0].strip()
    tgt = event.split(';')[1].split(')')[0].strip()
    tsk = event.split('[')[1].split('(')[1].split(',')[0].strip()

    name = event.split('[')[1].replace(']', '').replace(
        '"', '').replace('-&gt;', '-->').strip()

    classes = "type_projChoreo"

    if((len(_id)==3) & ("e" == _id[0]) & ("r" == _id[2])):
        classes = classes + " " + "type_projReceiver"
    body = {
        'data': {
            'id': _id,
            'name': name,
        },
        # 'position': { "x": num_task*100, "y": 100},
        'group': "nodes",
        'classes': classes
    }

    return body


def bodyChoreo(event, num_task, externalIds):
    """
    decomposes a choreography event into a cytoscape node description.

    :param event: event to decompose
    :param num_task: number of the task to plot the node into the graph (not in use) 
    :param externalIds: list of external events of the projection
    
    :returns: dictionary description of the node event according to cytoscape js syntax
    """

    _id = event.split('[')[0]
    src = event.split('src=')[1].split('tgt=')[0].strip()
    tgt = event.split('tgt=')[1].replace('tgt=', ',').replace(']', '').strip()
    tsk = event.split('[')[1].split('src=')[0].replace(
        '"', '').strip().replace(' ', '')

    if _id in externalIds:
        body = {
            'data': {
                'id': _id,
                'name': src+'\n' +
                tsk+'\n' +
                tgt
            },
            # 'position': { "x": num_task*100, "y": 100},
            'group': "nodes",
            'classes': "external type_choreography"
        }

    else:
        body = {
            'data': {
                'id': _id,
                'name': src+'\n' +
                tsk+'\n' +
                tgt
            },
            # 'position': { "x": num_task*100, "y": 100},
            'group': "nodes",
            'classes': "choreography type_choreography"

        }

    return body


def getEventElems(event, numTask, externalIds):
    """
    decomposes an event into a cytoscape node description (whether choreography, external, or internal).

    :param event: event to decompose
    :param num_task: number of the task to plot the node into the graph (not in use) 
    :param externalIds: list of external events of the projection
    
    :returns: dictionary description of the node event according to cytoscape js syntax
    """

    if 'src' in event:
        return bodyChoreo(event, numTask, externalIds)
    elif ('!' in event) or ('?' in event):
        return bodyExternal(event, numTask, externalIds)
    else:
        return bodyInternal(event, numTask, externalIds)


def cytoTasks(events, externalIds):
    """
    retrieves the cytoscape node description of a set of events 

    :param events: event to compute
    :param externalIds: list of external events of the projection    
    :returns: dictionary description of the node event according to cytoscape js syntax
    """

    cTasks = []

    num_task = 0
    for event in events:
        cTasks.append(getEventElems(event, num_task, externalIds))
        num_task = num_task+1
    return cTasks


def cytoEdges(edges):
    """
    retrieves the cytoscape edge description of a set of relations 

    :param edges: relations to compute    
    :returns: dictionary description of the relations according to cytoscape js syntax
    """

    cEdges = []
    for relation in edges:
        elems = getRelationElems(relation)
        cEdges.append(
            {
                'data': {
                    'id': elems['r_from'] + '_' + elems['r_to'] + '_' + elems['r_type'],
                    'source': elems['r_from'],
                    'target': elems['r_to'],
                },
                'group': "edges",
                'classes': elems['r_type']
            }
        )

        if elems['r_type'] == 'response':
            cEdges.append(
                {
                    'data': {
                        'id': elems['r_from'] + '_' + elems['r_to'] + '_' + elems['r_type'] + '_back',
                        'source': elems['r_to'],
                        'target': elems['r_from'],
                    },
                    'group': "edges",
                    'classes': elems['r_type'] + ' back'
                }
            )

    return cEdges


def generateGraph(pi, data, externalIds, target, role):
    """
    computes the cytoscape description of a set of a dcr graph (events and relations) and saves it to target file.

    :param pi: process id
    :param data: dcr textual representation to compute
    :param externalIds: list of external ids to the projection
    :param target: target path to save the cytoscape translation
    :param role: projection type (global, public, or other)
    
    """

    # chunk events

    if (role not in ['Global', 'Public']):
        chunks = extractRoleChunks(data)
        # generate tasks and relations
        cTasks = cytoTasks(
            chunks['events']+chunks['internalEvents'], externalIds)
        cEdges = cytoEdges(chunks['linkages'])

    else:
        # generate tasks and relations
        chunks, roles = extractChunks(data)
        cTasks = cytoTasks(
            chunks['events']+chunks['internalEvents'], externalIds)
        cEdges = cytoEdges(chunks['linkages'])

    # fix ctask coordinates:
    # with open(os.path.join(target.replace('projections','resources'),'data'+role+'_init.json')) as json_file:
    #    cData = json.load(json_file)

    cData = cTasks + cEdges

    # json dumps
    if (role not in ['Global', 'Public']):
        roleMapping = getRoleMapping(pi, role)
        role_id = roleMapping['id']
    else:
        role_id = role

    # return(cData)

    with open(os.path.join(target, 'temp_data'+role_id+'.json'), 'w') as outfile:
        json.dump(cData, outfile, indent=2)
