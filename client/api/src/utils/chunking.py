from src.utils.formatting import cleanName, getFileName, groupItems, getRoleTenant, getSender, getReceiver, getRole, getArrowLink, getChoreographyDetails, getType, getRoleList,generateDictEvent,generateDictRelation
import numpy as np
import json
import os


"""
    Help functions to extract dcr events and relations out of a dcr textual representation
    ...


    Methods
    -------

    Retrieving functions
        :extractGroupRelations(groupings, linkages):remove groupings in a set of relations 
        :extractChunks(data): translates the dcr description into a dictionary 
        :extractRoleChunks(data): extracts all local events out of the dcr description  
        :getLinkages(projRefs, linkages):: extracts all relations where a given set of events is described
        :getRoles(pi):retrieves list of roles belonging to the process pi
        :getRoleMapping(pi,role): retrieves role id from name

    Composition functions (external events & cie)
        :transitiveIncludeExclude(rExt, e, l, rGlob): enriches the list of external events with the list of transitive include/exclude relations stemming from e
        :transitiveResponse(rExt, e, l, rGlob): enriches the list of external events with the list of transitive response relations stemming from e.
        :computeExternalRelations(externalLinkages,externalIds,eGlob): extracts the list of relations involving external events
        :computeExternalEvents(rExt, eProj): computes the list of external events out of the list of external relations
        :retrieveExternalRelations(eProj, rProj, eGlob, rGlob): computes the list of external events out of the list of external relations
        :getEventDeclarationFromName(ext_names,all_events): computes the list of external events 
        :applyComposition(roleIds, rProj, chunks): retrieve list of external events names and declarations, and external relations 

"""

#### RETRIEVING FUNCTIONS 

def extractGroupRelations(groupings, linkages):
    """
    remove groupings in a set of relations 

    :param groupings: list of groups to remove
    :param linkages: list of relations to clean

    :returns: list of cleaned relations (no more groups)
    """

    #clean list
    count = 0
    for line in linkages: 
        spl = line.split()
        if len(spl) > 3:
            if '"' in spl[0] and spl[1]:
                newLine=spl[0]+spl[1] + ' '+' '.join(spl[2:])
                linkages[count] = newLine.replace('"', '')
                
            if '"' in spl[-1] and spl[-2]:
                newLine=' '.join(spl[0:2]) + ' ' + spl[-2]+spl[-1] 
                linkages[count] = newLine.replace('"', '')
        count = count +1

    cleaned_linkages = linkages
    # verify if group expends on several lines: create grouping dict
    for group in groupings:

        # extract group name
        groupName = group.split('Group')[1].split('{')[0].strip().replace(' ', '').replace('"', '')
        # extract relations included in grouping
        groupRelations = group.split('Group')[1].split('{')[1].replace('}', '').split()        
        #clean group
        cnt=0
        for elem in groupRelations:
            if (groupRelations[cnt][0] == '"') and (groupRelations[cnt+1][-1]=='"'):
                groupRelations[cnt]=groupRelations[cnt]+groupRelations[cnt+1]
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
            #print('elem:'+ elem)
            hasFirst = False
            hasLast = False

            for link in linkages:
                #print(link)
                if elem in link.split()[0]:
                    hasLast = True
                    #print('has last')
                elif elem in link.split()[-1]:
                    hasFirst = True
                    #print('has first')

            if not hasFirst:
                firstRelation=elem
            elif not hasLast:
                lastRelation=elem
            else:
                pass

        # regenerate relations according to the type 
        for relation in toDuplicate:
            chunks = relation.split()
            if groupName in chunks:
                if groupName == chunks[0].strip():
                    for elem in groupRelations:
                        #duplicatedRelation = firstRelation + ' ' + ' '.join(chunks[1:])
                        duplicatedRelation =  elem + ' ' + ' '.join(chunks[1:])
                        linkages.append(duplicatedRelation) 
                else: # groupName == chunks[-1].strip():
                    for elem in groupRelations:
                        #duplicatedRelation = firstRelation + ' ' + ' '.join(chunks[1:])
                        duplicatedRelation = ' '.join(chunks[:-1]) + ' ' + elem
                        linkages.append(duplicatedRelation) 
            else:
                pass

        # remove former relations with grouping name
        cleaned_linkages = []
        for relation in linkages:
            if groupName not in relation:
                cleaned_linkages.append(relation)

    return cleaned_linkages


def extractChunks(data):
    """
    translates the dcr description into a dictionary 

    :param data: dcr description to analyze

    :returns: dict description of the dcr text. Dict keys: {events,internalEvents,linkages}
    
    """
    #print("2.3/ chunk's data")
    #print(data)
    events, internalEvents = [], []
    groupings, linkages = [], []
    roles, addresses = [], []
    #misc = []

    for line in data:
        if (line[0] !=  '#'):
            if(line[0:8] == 'pk[role='):
                pk_val = line.split('role=')[1].replace(']','').replace(' ','').replace('\n','').split('=')
                add = {'role':pk_val[0],'pk':pk_val[1]}
                addresses.append(add)
            else:
                if ('src' in line) and ('tgt' in line):
                    #print("FOUND A CHOREO")
                    #print(line)
                    lineclean = line.replace('= ', '=').replace(' =', '=').replace(' = ', '=')
                    events.append(lineclean)
                    for elem in line.split(' '):
                        if ('src' in elem) or ('tgt' in elem):
                            elemclean = elem.strip().replace('tgt=', '').replace('src=', '').replace(']', '')
                            if elemclean != '' and (elemclean not in roles):
                                roles.append(elemclean)
                elif ('-' in line) and ('>' in line):
                    linkages.append(line.strip())
                elif ('role=' in line):
                    nameChunk = line.split()
                    role = nameChunk.pop()
                    name=''.join(nameChunk).replace('"', '')
                    cleanedInternalEvent = name+' '+ role
                    internalEvents.append(cleanedInternalEvent)
                else:
                    pass
                    #misc.append(line)
            
            for i in range(0, len(linkages)):
                if (linkages[i][0] == '#'):
                    linkages.remove(linkages[i])

    linkages = extractGroupRelations(groupings, linkages)

    chunks = {
        'events':events,
        'internalEvents':internalEvents,
        'linkages':linkages,
        'addresses':addresses
    }

    return chunks, roles


def extractRoleChunks(data):
    """
    extracts all local events out of the dcr description  

    :param data: dcr description to analyze

    :returns: dict description of the local events. Dict keys: {events,internalEvents,linkages}
    
    """

    events, internalEvents = [], []
    linkages = []

    for line in data:
        if ((line[0] != '#') & (line[0:8] != 'pk[role=')):
            if 'role=' in line:
                internalEvents.append(line)
            elif ('src=' in line) or ('tgt=' in line) or ('?(' in line) or ('!(' in line):
                events.append(line)
            elif ('-' in line) and ('>' in line):
                linkages.append(line)
            else:
                pass
            
    chunks = {
        'events':events,
        'internalEvents':internalEvents,
        'linkages':linkages,
    }
    return chunks


def getLinkages(projRefs, linkages):
    """
    extracts all relations where a given set of events is described

    :param str[] projRefs: roles to analyze
    :param str[] linkages: dcr description to analyze

    :returns: the list of relations where projRefs events are involved
    
    """

    for ref in projRefs:
        testRef=ref.replace('s','').replace('r', '')
        count=0
        for line in linkages:
            if testRef in line:
                lineUpd=line.strip().split(' ')
                i=0
                for elem in lineUpd:
                    if ((testRef == elem) and (elem[0] != '#') and (line[0:8] != 'pk[role=')):
                        lineUpd[i]=ref
                    i = i+1   
                linkages[count] = ' '.join(lineUpd)
            count = count+1
    return linkages

def getRoles(pi):
    """
    retrieves list of roles belonging to the process pi

    :param pi: process id (eg "p1")

    :returns: the list of roles of the projection (eg: ["r1","r2","r3"]).
    """

    this_folder = os.path.dirname(os.path.abspath(__file__))
    try:
        dbPath='../../client/src/projections/DCR_Projections.json'
        #dbPath = os.path.join(this_folder, '..\..\..\src\projections\DCR_Projections.json')
        with open(dbPath) as json_file:
            db = json.load(json_file)

        dcrs = db[pi]['TextExtraction']
    except:
        dbPath='../../client/src/projections/dcrTexts.json'
        # dbPath = os.path.join(this_folder, '..\..\..\src\projections\dcrTexts.json')
        with open(dbPath) as json_file:
            dcrs = json.load(json_file)

    roles=[]
    for elem in dcrs['roleMapping']:
        roles.append(elem['role'])
    
    return roles


def getRoleMapping(pi,role):
    """
    retrieves role id from name

    :param pi: process id (eg "p1")
    :param role: role name (eg "Driver")
    :returns: the role id.
    """
    this_folder = os.path.dirname(os.path.abspath(__file__))
    try:
        dbPath='../../client/src/projections/DCR_Projections.json'
        # dbPath = os.path.join(this_folder, '..\..\..\src\projections\DCR_Projections.json')
        with open(dbPath) as json_file:
            db = json.load(json_file)

        dcrs = db[pi]['TextExtraction']
    except:
        dbPath='../../client/src/projections/dcrTexts.json'
        # dbPath = os.path.join(this_folder, '..\..\..\src\projections\dcr_Texts.json')

        with open(dbPath) as json_file:
            dcrs = json.load(json_file)

    for elem in dcrs['roleMapping']:
        #print(elem)
        if (elem['role']==role):
            return elem
    
    else: 
        return 'err- role not found'


##### COMPOSITION FUNCTIONS

def transitiveIncludeExclude(rExt, e, l, rGlob):
    """
    enriches the list of external events with the list of transitive include/exclude relations stemming from e:
    the target is consecutive condition/milestone and include/exclude relations.

    :param rExt: list of external events
    :param e: event to analyze
    :param l: relation to analyze
    :param rGlob: list of relations defined in the global graph

    :returns: the list of external events enriched with transitive exclude / include relations
    
    """

    if((e==getReceiver(l)) and (getType(l) in ['condition', 'milestone'])):
        for rel in rGlob:
            if((getType(rel) in ['include','exclude']) and (getReceiver(rel)==getSender(l))):
                rExt.append(rel)
    return rExt


def transitiveResponse(rExt, e, l, rGlob):
    """
    enriches the list of external events with the list of transitive response relations stemming from e:
    the target is consecutive milestone and response relations.

    :param rExt: list of external events
    :param e: event to analyze
    :param l: relation to analyze
    :param rGlob: list of relations defined in the global graph

    :returns: the list of external events enriched with transitive response relations
    
    """
    if((e==getSender(l)) and(getType(l)=='milestone')):
        for rel in rGlob:
            if ((getType(rel)=='response') and (getSender(rel)==getReceiver(l))):
                rExt.append(rel)
    return rExt


def computeExternalRelations(externalLinkages,externalIds,eGlob):
    """
    extracts the list of relations involving external events

    :param externalLinkages: list of external relations retrieved
    :param externalIds: list of names of external events
    :param eGlob: list of names of global events

    :returns: the list of relations involving external events updated with the global events names.
    
    """

    _externalLinkages = []
    for link in externalLinkages:
        sender = getSender(link)
        receiver = getReceiver(link)
        arrow_link = getArrowLink(link)

        if sender in externalIds:
            for elem in eGlob:
                toTest = getRole(elem) 
                if toTest in sender:
                    newLink = toTest + ' ' + arrow_link + ' ' + receiver
                    _externalLinkages.append(newLink)
        else: # receiver in externalIds:
            for elem in eGlob:
                toTest = getRole(elem)  
                if toTest in receiver:
                    newLink = sender + ' ' + arrow_link + ' ' + toTest    
                    _externalLinkages.append(newLink.strip())

    return _externalLinkages


def computeExternalEvents(rExt, eProj):
    """
    computes the list of external events out of the list of external relations

    :param rExt: list of external relations retrieved
    :param eProj: list of names of projection events

    :returns: the list of external events linked to the projection e
    """

    eExt=[]
    for r in rExt:
        sender = getSender(r)
        receiver = getReceiver(r)

        if ((sender not in eExt) and (sender not in eProj)):
            eExt.append(sender)

        if ((receiver not in eExt) and (receiver not in eProj)):
            eExt.append(receiver)
    return eExt


def retrieveExternalRelations(eProj, rProj, eGlob, rGlob):
    """
    computes the list of external events out of the list of external relations

    :param eProj: list of projection events
    :param rProj: list of relations belonging to the relation 
    :param eGlob: list of global events
    :param rGlob: list of global relations

    :returns: the list of external events of the projection, and the list of external events of the projection.
    """

    rExt=[]
    for e in eProj:
        for l in rGlob:
            if((l not in rProj) and (e == getReceiver(l))):
                rExt.append(l) # direct relations
                rExt = transitiveIncludeExclude(rExt, e, l, rGlob)
                rExt = transitiveResponse(rExt, e, l, rGlob)

    eExt = computeExternalEvents(rExt, eProj)
    rExt = computeExternalRelations(rExt,eExt,eGlob)

    return eExt, rExt


def getEventDeclarationFromName(ext_names,all_events):
    """
    computes the list of external events 


    :param ext_names: list of external events names
    :param all_events: list of the declaration of all events

    :returns: the list of external events declarations.
    """

    externalEvents = []
    for elem in all_events:
        for n in ext_names:
            if getRole(elem) in n:
                externalEvents.append(elem)
    return externalEvents


def applyComposition(roleIds, rProj, chunks):    
    """
    retrieve list of external events names and declarations, and external relations 

    :param roleIds: list of local events of the projection
    :param rProj: list of the relations of the projection
    :param chunks: chunked version of the dcr global graph

    :returns: the list of external events names, the list of external events declarations, and the list of external relations.
    """

    externalLinkages = []

    eGlob=chunks['internalEvents'] + chunks['events']
    rGlob=chunks['linkages']

    # retrieve relations
    eProj=roleIds
    eExt, rExt = retrieveExternalRelations(eProj,rProj,eGlob,rGlob)

    # retrieve corresponding events
    externalEvents = getEventDeclarationFromName(eExt,eGlob)        

    return eExt, externalEvents, rExt

