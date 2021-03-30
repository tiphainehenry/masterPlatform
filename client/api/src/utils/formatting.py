import sys
import argparse
import json
import numpy as np
import copy

"""
    Help functions to help deal with dcr textual inputs
    ...

    Methods
    -------
    Misc
        :getFileName(path): returns name of the file
    Dict extraction
        :generateDictEvent(events): generates dictionnary of events out of a list of textual descriptions
        :generateDictRelation(relations):generates dictionnary of relations out of a list of textual descriptions
        :cleanName(nameChunked): cleans chunked name 
        :groupItems(role, refs): definition of a grouping of events  
        :removeGroups(data): remove groups from a textual description  
    Relations - gnl
        :getArrowLink(relation):extract arrow type
        :getType(relation): extract arrow type
    Choreography
        :getSender(relation): get sender name of a choreography event
        :getReceiver(relation): get receiver name of a choreography event
        :getChoreographyDetails(event): extract choreography details from a choreography event
    Local task    
        :getRoleTenant(event): get role name of a local event
        :getRole(relation): get role name of a relation
        :getRoleList(e): get role list of a dcr text description

"""


def getFileName(args=sys.argv[1:]):
    """
    returns name of the file

    :returns: filename: name of the file
    """

    ap = argparse.ArgumentParser()
    ap.add_argument("-f", "--file", required=True, help="DCR file to project")
    args = vars(ap.parse_args())
    return args["file"]


def cleanName(nameChunked):
    """
    cleans chunked name 

    :param nameChunked: chunked name extracted from the dcr text input
    :returns: updated name and task cleaned with the updated name 
    """

    cleanedTsk = ""
    if nameChunked != []:
        for tsk in nameChunked:
            eventName = ""
            if ("[" in tsk):
                tskbis = tsk.split("[")
                eventName = tskbis[0]
                cleanedTsk += tskbis[1]
            else:
                eventName = tsk
                cleanedTsk += tsk
        return eventName, cleanedTsk
    else:
        return "", cleanedTsk


def groupItems(role, refs):
    """
    definition of a grouping of events  

    :param role: name of the grouping
    :param refs: all elements to be grouped
    :returns: textual description of the event grouping
    """

    no_duplicates = []
    for ref in refs:
        if ref not in no_duplicates:
            no_duplicates.append(ref)
    return [
        "\n## Proj Grouping ##",
        'Group "' + role + '" {'+' '.join(no_duplicates)+'}'
    ]


def removeGroups(data):
    """
    remove groups from a textual description  

    :param data: textual description of the global graph
    :returns: cleaned data
    """

    # extract group elems
    groupElems = []

    cnt = 0
    for line in data:
        if "Group" in line:
            gName = line.split("Group")[1].split(
                '{')[0].replace('"', '').strip()
            events = line.split('{')[1].split('}')[0].split(' ')
            groupElems.append({'gName': gName,
                               'events': events})
    # for each elem, scan relations and replace adequatly

    # extract relations:

    relations = []
    bla = 0
    for line in data:
        if (line[0] != '#') and ('-' in line) and ('>' in line):
            relations.append(line.strip())

    newRelations = []
    cnt = 0

    grpNames = [elem['gName'] for elem in groupElems]

    # update src
    updatedSrc = []
    for relation in relations:
        src = relation.split(' ')[0].strip()
        if src in grpNames:
            newR = []
            for elem in groupElems:
                if elem['gName'] == src:
                    newR = elem['events']
            for elem in newR:
                toAdd = elem + ' ' + ' '.join(relation.split(' ')[1:])
                updatedSrc.append(toAdd)
        else:
            updatedSrc.append(relation)

    updatev2 = []
    for relation in updatedSrc:
        tgt = relation.split(' ')[-1].strip()

        if tgt in grpNames:
            newR = []
            for elem in groupElems:
                if elem['gName'] == tgt:
                    newR = elem['events']
            for elem in newR:
                toAdd = ' '.join(relation.split(' ')[:-1]) + ' '+elem
                updatev2.append(toAdd)

        else:
            updatev2.append(relation)

    events = []
    for line in data:
        if ('[' in line) and ('-' not in line) and ('>' not in line):
            events.append(line.strip())

    newData = events + updatev2
    return newData


def getSender(relation):
    """
    get sender name of a choreography event

    :param relation: relation to analyze 
    :returns: name of the sender
    """
    return relation.split()[0].strip()


def getReceiver(relation):
    """
    get receiver name of a choreography event

    :param relation: relation to analyze 
    :returns: name of the receiver
    """
    return relation.split()[-1].strip()


def getRoleTenant(event):
    """
    get role name of a local event

    :param event: role declaration to analyze
    :returns: name of the tenant responsible for the role
    """

    return event.split('role=')[-1].replace(']', '').strip()


def getRole(relation):
    """
    get role name of a relation

    :param relation: relation to analyze
    :returns: name of the tenant initiating the relation
    """
    return relation.split('[')[0].strip()


def getRoleList(e):
    """
    get role list of a dcr text description

    :param e: list of relations to analyze
    :returns: list of tenants involved in the list of relations
    """

    # remove comments
    events = []
    for elem in e:
        if((elem[0] != '#') and (getRole(elem) not in events)):
            events.append(getRole(elem))
    return events


def getArrowLink(relation):
    """
    extract arrow type

    :param relation: relation to analyze
    :returns: arrow describing the relation
    """

    return relation.split()[1].strip()


def getChoreographyDetails(event):
    """
    extract choreography details from a choreography event

    :param event: event to analyze
    :returns:
        :str eventName: name of the choreography event (eg ei)
        :str task: name of the choreography task (eg Deliver)
        :str src: choreography sender (eg Driver)
        :str[] tgts: list of choreography receivers (eg [Customer, Florist])

    """

    src = event.split('src=')[1].split('tgt=')[0].strip()
    tgts = ' '.join(event.split('tgt=')[1:]).replace(
        ']', '').replace('tgt=', ',').replace('  ', ',').strip()
    task = event.split('[')[1].split('src=')[0].strip()
    eventName = event.split('[')[0].strip().replace('"', '').replace(' ', '')

    return eventName, task, src, tgts


def getType(relation):
    """
    extract arrow type

    :param relation: relation to analyze
    :returns: relation type
    """

    if '<>' in relation:
        relType = 'milestone'
    elif '>*' in relation:
        relType = 'condition'
    elif '*-' in relation:
        relType = 'response'
    elif '+' in relation:
        relType = 'include'
    elif '%' in relation:
        relType = 'exclude'
    else:
        relType = 0  # no relation, wrong input (error to raise)
    return relType


def generateDictEvent(events):
    """
    generates dictionnary of events out of a list of textual descriptions

    :param events: list of events to analyze
    :returns: dictionnary of events with keys {id, event}
    """

    dictList = []
    ind = 0
    for elem in events:
        if ((elem[0].strip() != '#') and ('Declaration' not in elem)):
            dictList.append({
                'id': ind,
                'event': elem
            })
            ind = ind+1

    return dictList


def generateDictRelation(relations):
    """
    generates dictionnary of relations out of a list of textual descriptions

    :param relations: list of relations to analyze
    :returns: dictionnary of relations with keys {id, event}
    """

    dictList = []
    ind = 0
    for elem in relations:
        if ((elem[0].strip() != '#') and ('Linkages' not in elem)):
            dictList.append({
                'id': ind,
                'relation': elem
            })
            ind = ind+1
    return dictList


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)
