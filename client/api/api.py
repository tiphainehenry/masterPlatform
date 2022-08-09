import os
import pathlib
import argparse
import sys
import json
import glob
import logging
import pprint

import ipfshttpclient

from simplejson import JSONDecodeError
from flask import Flask, flash, request, redirect, url_for, session, jsonify
from flask_cors import CORS, cross_origin
from flask_restful import reqparse, abort, Api, Resource
from werkzeug.utils import secure_filename
from src.projalgoGlobal import projectGlobal, projectGlobalforPublicChange
from src.projalgoPublic import projectPublic
from src.projalgoRoles import projRole, projRole_fromLocalRequest, projRole_fromPublicRequest
from src.utils.formatting import removeGroups, getChoreographyDetails
from src.utils.vectorization import getRelationElems
from src.utils.chunking import getRoles, getRoleMapping
from src.utils.graphManager import executeNode, executeApprovedNode, execLogg, initializeGraph, retrieveMarkingOnId

from src.utils.chunking import extractChunks, getLinkages, applyComposition, getRoles, getRoleMapping

from src.utils.vectorization import vectorizeRole, vectorizeRoleFromCyto

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('HELLO WORLD')
app = Flask(__name__, static_folder='../build', static_url_path='/')
cors = CORS(app, resources={r"*": {"origins": "*"}})
api = Api(app)

projDBPath = '../../client/src/projections/DCR_Projections.json'


def loadJSONFile(path):
    with open(path) as json_file:
        dataDict = json.load(json_file)
    return dataDict


def dumpJSONFile(path, data):
    with open(path, 'w') as outfile:
        json.dump(data, outfile, indent=2)


def getId(processID, role):
    """
    get projection id

    :param processID: process id. eg: 'p1'
    :param role: the role of interest. eg: 'Driver'
    :returns: the projection id binded to the role, eg 'r1'
    """

    roleMapping = getRoleMapping(processID, role)
    return roleMapping['id']


def updWithName(dataTxt, pi, projType):
    """
    generates projections from textual representation

    :param dataTxt: text input to project
    :param pi: process id to be generated. eg: 'p1'
    """
    print("Uploading new version ...")
    target = '../../client/src/projections/'
    dataPath = '../../client/src/projections/dcrTexts.json'
    this_folder = os.path.dirname(os.path.abspath(__file__))
    # target = os.path.join(this_folder, '..\src\projections\\')
    # dataPath = os.path.join(this_folder, '..\src\projections\dcrTexts.json')
    #print("target datapath")
    # print(target)
    # print(dataPath)

    _data = removeGroups(dataTxt)

    #print("2/ updWithName  -----------------------")
    projectGlobal(pi, dataTxt, target)

    # print("debug")
    # exit(-1)

    dataDict = loadJSONFile(dataPath)
    dataDict['externalEvents'] = []
    dumpJSONFile(dataPath, dataDict)
    dumpJSONFile(os.path.join(
        target, 'temp_execPublic.json'), {"execLogs": []})

    for role in getRoles(pi):
        print('[INFO] Starting projection on role '+role)
        projRole(pi, dataTxt, target, role)
        dumpJSONFile(os.path.join(target, 'exec' +
                                  getId(pi, role)+'.json'), {"execLogs": []})

    projectPublic(pi, dataTxt, target)

    # merge all
    processData = {'id': pi}

    processData['TextExtraction'] = loadJSONFile(
        os.path.join(this_folder, '../src/projections/dcrTexts.json'))
    processData['Global'] = {
        'data': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_dataGlobal.json')),
        'vect': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_vectGlobal.json'))
    }
    processData['Public'] = {
        'data': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_dataPublic.json')),
        'exec': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_execPublic.json')),
        'vect': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_vectPublic.json'))
    }
    processData['projType'] = projType

    print(dataTxt)
    processData['variables'] = json.loads(dataTxt[-1])

    for role in getRoles(pi):
        roleMapping = getRoleMapping(pi, role)
        #rolePath= os.path.join(this_folder, '../src/projections/temp_data'+roleMapping['id']+'.json')

        processData[roleMapping['id']] = {
            'data': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_data'+roleMapping['id']+'.json')),
            'exec': loadJSONFile(os.path.join(this_folder, '../src/projections/exec'+roleMapping['id']+'.json')),
            'vect': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_vect'+roleMapping['id']+'.json')),
            'init': {
                'data': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_data'+roleMapping['id']+'.json')),
                'vect': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_vect'+roleMapping['id']+'.json'))
            }
        }

        os.remove(os.path.join(
            this_folder, '../src/projections/temp_data'+roleMapping['id']+'.json'))
        os.remove(os.path.join(
            this_folder, '../src/projections/temp_vect'+roleMapping['id']+'.json'))
        os.remove(os.path.join(
            this_folder, '../src/projections/exec'+roleMapping['id']+'.json'))

    # savethis_folder
    dataJson = loadJSONFile(projDBPath)
    dataJson['p'+str(len(dataJson)+1)] = processData
    print(processData)

    dumpJSONFile(projDBPath, dataJson)

    # rm temp files
    os.remove(os.path.join(this_folder, '../src/projections/temp_dataPublic.json'))
    os.remove(os.path.join(this_folder, '../src/projections/temp_vectPublic.json'))
    os.remove(os.path.join(this_folder, '../src/projections/temp_execPublic.json'))
    os.remove(os.path.join(this_folder, '../src/projections/temp_dataGlobal.json'))
    os.remove(os.path.join(this_folder, '../src/projections/temp_vectGlobal.json'))

    os.remove(os.path.join(this_folder, '../src/projections/dcrTexts.json'))


@app.route('/')
def index():
    return app.send_static_file('index.html')


def byteify(input):
    if isinstance(input, dict):
        return {byteify(key): byteify(value)
                for key, value in input.iteritems()}
    elif isinstance(input, list):
        return [byteify(element) for element in input]
    elif isinstance(input, unicode):
        return input.encode('utf-8')
    else:
        return input


@app.route('/library', methods=['POST', 'GET'])
def SaveToLibrary():
    """
     Save a Template into the Library / return a certain template from the library
             value: this.state.dataFields[i].value,
        activitiesName : this.state.dataFields[i].activitiesName,
        matrix: this.state.dataFields[i].matrix,
        role: this.state.dataFields[i].role,
    """

    dataPath = '../../client/src/projections/Library.json'
    # print(request.method)
    if request.method == 'POST':
        data = request.get_json(silent=True)

        processID = byteify(data['processID'])
        graph = byteify(data['data'])

        template = {processID: graph}
        graph = byteify(template)

        with open(dataPath, "r+") as json_file:
            library = json.load(json_file)
            if (processID in library):
                library.pop(processID)
            json_file.truncate(0)
            library.update(template)
            json_file.seek(0)
            json.dump(library, json_file)
        return 'OK', 200, {'Access-Control-Allow-Origin': '*'}
    else:
        key = request.args.get('processID', default="", type=str)
        all = request.args.get('all', default="", type=str)
        with open(dataPath, "r") as json_file:
            library = json.load(json_file)
            if not all == "":
                print(library.keys())
                return jsonify(library.keys())
                # return json.dumps(list(library.keys()))
            if not(key in library):
                return "KO", 200, {'Access-Control-Allow-Origin': '*'}
            else:
                return jsonify(library[key]), 200
        # return 'OK', 200, {'Access-Control-Allow-Origin': '*'}


@app.route('/process', methods=['POST', 'GET'])
def processData():
    """
    computes event execution request
    """

    data = request.get_json(silent=True)
    status = executeNode(data)

    # update execLog
    if 'BC' not in status:
        role = data['projId']
        processID = data['processID']
        activity_name = data['idClicked']
        activity_name_details = data['activityName']
        start_timestamp = data['start_timestamp']
        data = data['data']

        execLogg(role, processID, activity_name_details,
                 status, start_timestamp, data)

    return status, 200, {'Access-Control-Allow-Origin': '*'}


@app.route('/BCupdate', methods=['POST', 'GET'])
def processBCData():
    """
    updates projections (markings, logs) after blockchain-processed event execution
    """

    data = request.get_json(silent=True)
    status = data['execStatus']
    activity_name = data['idClicked']
    activity_name_details = data['activityName']
    start_timestamp = data['start_timestamp']
    processID = data['processID']
    role = data['projId']
    data = data['data']

    if ('rejected' in status):
        # update execLog
        role_id = getId(processID, role)

        #pExec = glob.glob('../../client/src/projections/exec'+role_id+'*')[0]
        execLogg(role, processID, activity_name_details,
                 status, start_timestamp, data)

    else:

        dataPath = '../../client/src/projections/DCR_Projections.json'
        with open(dataPath) as json_file:
            dataJson = json.load(json_file)

        # Update public projection
        nodes = dataJson[processID]['Public']['data']
        isPresent = False
        namesToTest = [activity_name]
        eventName = activity_name

        for nameToTest in namesToTest:
            for elem in nodes:
                if ((elem['group'] == 'nodes') and (nameToTest == elem['data']['id'])):
                    isPresent = True
                    # update markings

            if isPresent:
                executeApprovedNode(processID, role, nameToTest)

        execLogg('Public', processID, activity_name_details,
                 'public node - ' + status, start_timestamp, data)

        # Update roles
        for role in getRoles(processID):
            roleMapping = getRoleMapping(processID, role)

            nodes = dataJson[processID][roleMapping['id']]['data']

            isPresent = False

            namesToTest = [activity_name]
            eventName = activity_name
            if (activity_name[0] == 'e') and (activity_name[-1] == 's'):
                eventName = activity_name[:-1]
                # receive choreography subevent
                namesToTest.append(eventName+'r')
                namesToTest.append(eventName)  # choreography event

            for nameToTest in namesToTest:
                for elem in nodes:
                    if ((elem['group'] == 'nodes') and (nameToTest == elem['data']['id'])):
                        isPresent = True
                        # update markings

                if isPresent:
                    executeApprovedNode(processID, role, nameToTest)

            # update exec log
            execLogg(role, processID, activity_name_details,
                     'public node - ' + status, start_timestamp, data)

    return status, 200, {'Access-Control-Allow-Origin': '*'}


# @app.route('/reinit', methods=['POST', 'GET'])
# def reinitialise():
#    data = request.get_json(silent=True)
#    processID = data['processID']

#    dataPath = '../../client/src/projections/DCR_Projections.json'
#    with open(dataPath) as json_file:
#        dataDict = json.load(json_file)
#    dataGlobDict = dataDict['TextExtraction']['global']
#    data = []

#    for elem in dataGlobDict['events']:
#        data.append(elem['event'])

#    for elem in dataGlobDict['relations']:
#        data.append(elem['relation'])

#    upd(processIDdata)

#    return 'ok', 200, {'Access-Control-Allow-Origin': '*'}

@app.route('/localProj', methods=['GET', 'POST'])
def localProj():
    """
    updates local projection
    """

    try:
        file = request.files['file']
        localData = file.readlines()
        print("-----------------------------------")
        processID = str(request.form['processID'])
        roleID = str(request.form['roleID'])
        roleNum = str(request.form['roleNum'])
        publicData = request.form['JSONPubView']

        dataJson = loadJSONFile(projDBPath)

        # Update public projection
        #publicData = dataJson[processID]['TextExtraction']['public']

        # step1: enrich private events and relations --> scan all. If not matching: then add relation.
        localChunks, localRoles = extractChunks(localData)
        localRelations = []
        roleIds = []

        localEvents = []

        for elem in localChunks['events']:
            localEvents.append(str(elem).strip())
        for elem in localChunks['internalEvents']:
            localEvents.append(str(elem).strip())

        for r in localChunks['linkages']:
            lr = getRelationElems(r)
            for rData in publicData['relations']:
                pr = getRelationElems(rData['relation'])
                if (((lr['r_from'] != pr['r_from']) | (lr['r_to'] != pr['r_to']) | (lr['r_type'] != pr['r_type'])) and (rData['relation'] not in localRelations)):
                    localRelations.append(rData['relation'])
                    if(pr['r_from'] not in roleIds):
                        roleIds.append(pr['r_from'])
                    if(pr['r_to'] not in roleIds):
                        roleIds.append(pr['r_to'])

            localRelations.append(r)
            if(lr['r_from'] not in roleIds):
                roleIds.append(lr['r_from'])
            if(lr['r_to'] not in roleIds):
                roleIds.append(lr['r_to'])

        addresses = []
        for elem in publicData['privateEvents']:
            newA = 'pk[role='+elem['role']+']='+elem['address']
            if(newA not in addresses):
                addresses.append(str(newA))

        localEvents = list(set(localEvents))
        projText = addresses+localEvents+localRelations

        # step2: generate local projection (data and vect)
        target = '../../client/src/projections/'
        dataPath = '../../client/src/projections/dcrTexts.json'
        this_folder = os.path.dirname(os.path.abspath(__file__))

        projRole_fromLocalRequest(processID, projText, target, roleID, roleNum)

        dataJson = loadJSONFile(projDBPath)
        dataJson[processID][roleNum] = {
            'data': loadJSONFile(os.path.join(target, 'temp_data'+roleNum+'.json')),
            'exec': dataJson[processID][roleNum]['exec'],
            'vect': loadJSONFile(os.path.join(target, 'temp_vect'+roleNum+'.json')),
            'init': {
                'data': loadJSONFile(os.path.join(target, 'temp_data'+roleNum+'.json')),
                'vect': loadJSONFile(os.path.join(target, 'temp_vect'+roleNum+'.json'))
            }
        }

        dataJson['projType'] = 'p_to_g'

        dumpJSONFile(projDBPath, dataJson)

        os.remove(os.path.join(
            this_folder, '../src/projections/temp_data'+roleNum+'.json'))
        os.remove(os.path.join(
            this_folder, '../src/projections/temp_vect'+roleNum['id']+'.json'))
        os.remove(os.path.join(this_folder, '../src/projections/l.json'))

        return 'ok', 200, {'Access-Control-Allow-Origin': '*'}

    except:
        return 'nope', 500, {'Access-Control-Allow-Origin': '*'}


@app.route('/saveHash', methods=['GET', 'POST'])
def saveHash():
    """
    saves newly generated hash to the projections DB
    """
    try:
        data = request.get_json(silent=True)
        processID = data['processId']
        processHash = data['hash']

        dataProj = loadJSONFile(projDBPath)
        dataProj[processID]['hash'] = processHash
        dumpJSONFile(projDBPath, dataProj)

        return 'ok', 200, {'Access-Control-Allow-Origin': '*'}

    except:
        return 'nope', 500, {'Access-Control-Allow-Origin': '*'}


@app.route('/inputFile', methods=['GET', 'POST'])
def inputFileLaunch():
    """
    reads input dcr textual representation
    """
    # try:
    file = request.files['file']
    data = file.readlines()
    print("-----------------------------------")
    processID = str(request.form['processID'])
    projType = str(request.form['projType'])

    updWithName(data, processID, projType)

    return 'ok', 200, {'Access-Control-Allow-Origin': '*'}

    # except:
    #     return 'nope', 500, {'Access-Control-Allow-Origin': '*'}


@app.route('/delete', methods=['GET', 'POST'])
def delete():
    """
    deletes a process
    """

    data = request.get_json(silent=True)
    processID = data['processID']

    # projDBPath='../../client/src/projections/DCR_Projections.json'

    dataProj = loadJSONFile(projDBPath)
    dataProj.pop(processID, None)
    dumpJSONFile(projDBPath, dataProj)

    return 'ok', 200, {'Access-Control-Allow-Origin': '*'}


@app.route('/deleteAll', methods=['GET', 'POST'])
def deleteAll():
    """
    deletes all process instances!
    """

    # projDBPath='../../client/src/projections/DCR_Projections.json'
    dumpJSONFile(projDBPath, {})

    return 'ok', 200, {'Access-Control-Allow-Origin': '*'}


@app.route('/privateGraphUpd', methods=['GET', 'POST'])
def privateGraphUpd():
    """
    updates a private graph
    """

    data = request.get_json(silent=True)

    processID = data['processID']
    projID = data['projID']
    newData = data['newData']

    # vectorize
    vect = vectorizeRoleFromCyto(processID, projID, newData)

    # initialize and clean nodes, remove class duplicates.
    markings = vect['markings']
    updProj = []

    for elem in newData:
        if elem['group'] == 'nodes':
            # filter out external events
            if (('classes' not in elem.keys()) or ('external' not in elem['classes'])):
                elemMarking = retrieveMarkingOnId(markings, elem)

                if(len(elemMarking) != 0):
                    if (elemMarking['include'] == 1):
                        elem['classes'] = elem['classes'] + \
                            'included executable'

        updProj.append(elem)

    # print(vect)

    newRoleProjection = {
        'data': updProj,
        'vect': vect,
        'exec': {
            "execLogs": []
        }
    }
    # pprint.pprint(newRoleProjection)

    # store
    # projDBPath='../../client/src/projections/DCR_Projections.json'
    dataProj = loadJSONFile(projDBPath)
    dataProj[processID][projID]['v_upd'] = newRoleProjection
    dumpJSONFile(projDBPath, dataProj)

    return 'ok', 200, {'Access-Control-Allow-Origin': '*'}


def cleanActivityId(id, mapping):
    if((id[0] == 'e') and (id[-1] in ['r', 's'])):
        return id[0:-1]
    else:
        for elem in mapping:
            if id == elem['old_id']:
                return elem['new_id']
        return id


def pprintDict(_dict):
    for key, value in _dict.items():
        print('[KEY] '+str(key)+':')
        if isinstance(value, dict):
            for k, v in value.items():
                print('-->'+str(k)+':')
                print('   '+str(v))
        else:
            print(value)
        print('\n')


@app.route('/publicChg', methods=['GET', 'POST'])
def publicChg():
    """
    updates public view after change approval // 
    """
    try:
        processID = str(request.form['processID'])
        roleID = str(request.form['roleID'])
        publicData = json.loads(request.form['JSONPubView'])
        reqHash = str(request.form['reqHash'])

        # step1: generate text
        dcrTextList = []

        choreo = []
        toreformat = []
        events = []
        edges = []

        for ele in publicData:
            if ele['group'] == 'nodes':
                line = ele['data']

                if((ele['data']['id'][0] == 'e') & (ele['data']['id'][-1].isnumeric())):
                    activityName = ele['data']['name'].split('\n')[1]
                    src = ele['data']['name'].split('\n')[0]
                    tgt = ele['data']['name'].split('\n')[2]
                    event = ele['data']['id'] + \
                        '['+activityName+' src='+src+' tgt='+tgt+']'

                    if str(event) not in choreo:
                        choreo.append(str(event))

                elif ((ele['data']['id'][0] == 'e') & (not ele['data']['id'][-1].isnumeric())):
                    # precheck projection (may be wrong index)
                    if(ele['data']['name'][0] in ['?', '!']):
                        activityName = ele['data']['name'].split(
                            '?(')[1].split(',')[0]
                        src = ele['data']['name'].split(', ')[1].split('-')[0]
                        tgt = ele['data']['name'].split(
                            '>')[1].replace(')', '')
                        event = ele['data']['id'][0:-1] + \
                            '['+activityName+' src='+src+' tgt='+tgt+']'

                        if str(event) not in choreo:
                            choreo.append(str(event))

                    else:
                        activityName = str(ele['data']['name'].split('\n')[1])
                        src = str(ele['data']['name'].split('\n')[0])
                        tgts = ele['data']['name'].split('\n')[2].split(',')

                        event = ele['data']['id'][0:-1] + \
                            '['+activityName+' src='+src

                        for ele in tgts:
                            event = event+' tgt='+str(ele)
                        event = event+']'
                        if str(event) not in choreo:
                            choreo.append(str(event))

                else:
                    if((('\n' in ele['data']['name']) and (len(ele['data']['name'].split('\n')) != 2)) or (
                            (' ' in ele['data']['name']) and (len(ele['data']['name'].split(' ')) != 2))):

                        if ele not in toreformat:
                            toreformat.append(ele)

        # fetch number of public nodes in the original version
        dataJson = loadJSONFile(projDBPath)
        publicEvents = dataJson[processID]['TextExtraction']['public']['privateEvents']

        cleaned_publicEvents = []
        for elem in publicEvents:
            if str(elem['eventName']) not in cleaned_publicEvents:
                cleaned_publicEvents.append(str(elem['eventName']))
        max = 0
        for elem in cleaned_publicEvents:
            if ((elem[0] == 'e') and elem[-1].isdigit()):
                if int(elem.replace('e', '')) > max:
                    max = int(elem.replace('e', ''))
        mapping = []
        for ele in toreformat:
            # reformat node, (and later reformat edges)
            max = max+1
            activityName = str(ele['data']['name'].split(' ')[1]).capitalize()
            src = str(ele['data']['name'].split(' ')[0])
            tgt = str(ele['data']['name'].split(' ')[2])
            event = 'e'+str(max)+'['+activityName+' src='+src+' tgt='+tgt+']'

            choreo.append(event)
            mapping.append({
                'old_id': str(ele['data']['id']),
                'new_id': 'e'+str(max)
            })

        ###### add edges ##########
        for ele in publicData:
            if ele['group'] == 'edges':
                line = ele['data']

                arrow = ''
                if 'condition' in line['id']:
                    arrow = '-->*'
                elif 'response_back' in line['id']:
                    pass
                elif 'response' in line['id']:
                    arrow = '*-->'
                elif 'milestone' in line['id']:
                    arrow = '--<>'
                elif 'include' in line['id']:
                    arrow = '-->+'
                elif 'exclude' in line['id']:
                    arrow = '-->%'
                else:
                    pass
                    # print('NA')

                src = cleanActivityId(line['source'], mapping)
                tgt = cleanActivityId(line['target'], mapping)

                if arrow != '':
                    newLine = src+' '+arrow+' '+tgt
                    edges.append(newLine)

        ###### add public keys ########
        addresses = []
        for elem in publicEvents:
            newA = 'pk[role='+elem['role']+']='+elem['address']
            if(newA not in addresses):
                addresses.append(str(newA))

        # merge all and project
        projText = addresses+choreo+edges

        # step2: public projection (data and vect)
        target = '../../client/src/projections/'
        dataPath = '../../client/src/projections/dcrTexts.json'
        this_folder = os.path.dirname(os.path.abspath(__file__))

        projectGlobalforPublicChange(processID, projText, target)

        dataJson = loadJSONFile(projDBPath)

        projectPublic(processID, projText, target)

        TxtExt = loadJSONFile(os.path.join(target, 'dcrTexts.json'))

        pprintDict(TxtExt)

        dataJson[processID]['TextExtraction']['public'] = TxtExt['public']
        dataJson[processID]['TextExtraction']['global'] = TxtExt['global']

        # for role in getRoles(processID):
        #    print('[INFO] Starting projection on role '+role)
        #    projRole_fromPublicRequest(processID, projTxt, target, role)
        #print('ok 5')
        dataJson[processID]['Public'] = {
            'data': loadJSONFile(os.path.join(target, 'temp_data'+'Public'+'.json')),
            'exec': dataJson[processID]['Public']['exec'],
            'vect': loadJSONFile(os.path.join(target, 'temp_vect'+'Public'+'.json')),
            'init': {
                'data': loadJSONFile(os.path.join(target, 'temp_data'+'Public'+'.json')),
                'vect': loadJSONFile(os.path.join(target, 'temp_vect'+'Public'+'.json'))
            }
        }

        dataJson[processID]['projType'] = 'g_to_p'  # to check
        print('ok 5')

        dumpJSONFile(projDBPath, dataJson)

        for role in getRoles(processID):
            roleMapping = getRoleMapping(processID, role)
            #rolePath= os.path.join(this_folder, '../src/projections/temp_data'+roleMapping['id']+'.json')
            os.remove(os.path.join(
                this_folder, '../src/projections/temp_vect'+roleMapping['id']+'.json'))

        os.remove(os.path.join(
            this_folder, '../src/projections/temp_local.json'))
        os.remove(os.path.join(
            this_folder, '../src/projections/temp_data'+'Public'+'.json'))
        os.remove(os.path.join(
            this_folder, '../src/projections/temp_vect'+'Public'+'.json'))
        os.remove(os.path.join(this_folder, '../src/projections/dcrTexts.json'))

        return 'ok', 200, {'Access-Control-Allow-Origin': '*'}

    except:
        return 'nope', 500, {'Access-Control-Allow-Origin': '*'}


@app.route('/localChg', methods=['GET', 'POST'])
def localChg():
    """
    updates local projection after change
    """

    try:
        print("-----------------------------------")
        processID = str(request.form['processID'])
        roleID = str(request.form['roleID'])
        roleNum = str(request.form['roleNum'])
        publicData = json.loads(request.form['JSONPubView'])
        privateNodes = json.loads(request.form['JSONPriView'])
        edges = json.loads(request.form['JSONedges'])

        dataJson = loadJSONFile(projDBPath)

        # to do: newEdges: retrieve ! // watch out // upd vectors and markings
        # fetch complementary edges

        # retrieve public edges
        publicEdges = []
        publicEdges_ids = ",".join(
            str(x["data"]["id"]) for x in publicData if x["group"] == "edges").split(',')
        edges_ids = ",".join(str(x["data"]["id"])
                             for x in edges if x["group"] == "edges").split(',')

        edges_toAdd_ids = []
        edges_toAdd = []
        # first the id
        for ele in publicEdges_ids:
            if ele not in edges_ids:
                edges_toAdd_ids.append(ele)

        # then the full cytoscape description
        for _id in edges_toAdd_ids:
            for ele in publicData:
                toTest = ele['data']['id']
                if toTest == _id:
                    edges_toAdd.append(ele)

        newData = publicData+privateNodes+edges_toAdd

        # afterwards, translate newData into textual input (dcr workbench formalism)
        dcrTextList = []

        choreo = []
        private = []
        toreformat = []
        events = []
        edges = []

        for ele in newData:
            if ele['group'] == 'nodes':
                line = ele['data']

                if((ele['data']['id'][0] == 'e') & (ele['data']['id'][-1].isnumeric())):
                    activityName = ele['data']['name'].split('\n')[1]
                    src = ele['data']['name'].split('\n')[0]
                    tgt = ele['data']['name'].split('\n')[2]
                    event = ele['data']['id'] + \
                        '['+activityName+' src='+src+' tgt='+tgt+']'

                    if str(event) not in choreo:
                        choreo.append(str(event))

                elif ((ele['data']['id'][0] == 'e') & (not ele['data']['id'][-1].isnumeric())):
                    # precheck projection (may be wrong index)
                    if(ele['data']['name'][0] in ['?', '!']):
                        activityName = ele['data']['name'].split(
                            '?(')[1].split(',')[0]
                        src = ele['data']['name'].split(', ')[1].split('-')[0]
                        tgt = ele['data']['name'].split(
                            '>')[1].replace(')', '')
                        event = ele['data']['id'][0:-1] + \
                            '['+activityName+' src='+src+' tgt='+tgt+']'

                        if str(event) not in choreo:
                            choreo.append(str(event))

                    else:
                        activityName = str(ele['data']['name'].split('\n')[1])
                        src = str(ele['data']['name'].split('\n')[0])
                        tgts = ele['data']['name'].split('\n')[2].split(',')

                        event = ele['data']['id'][0:-1] + \
                            '['+activityName+' src='+src

                        for ele in tgts:
                            event = event+' tgt='+str(ele)
                        event = event+']'
                        if str(event) not in choreo:
                            choreo.append(str(event))

                else:
                    if((('\n' in ele['data']['name']) and (len(ele['data']['name'].split('\n')) != 2)) or (
                            (' ' in ele['data']['name']) and (len(ele['data']['name'].split(' ')) != 2))):

                        if ele not in toreformat:
                            toreformat.append(ele)
                    else:
                        if(('\n' in ele['data']['name']) and (len(ele['data']['name'].split('\n')) == 2)):
                            event = ele['data']['name'].split(
                                '\n')[1]+' [role='+ele['data']['name'].split('\n')[0]+']'
                            if str(event) not in private:
                                private.append(str(event))

                        elif((' ' in ele['data']['name']) and (len(ele['data']['name'].split(' ')) == 2)):
                            event = ele['data']['name'].split(
                                ' ')[1]+' [role='+ele['data']['name'].split(' ')[0]+']'
                            if str(event) not in private:
                                private.append(str(event))
                        else:
                            print('oops, error in detecting node category')

        # fetch number of public nodes in the original version
        dataJson = loadJSONFile(projDBPath)
        publicEvents = dataJson[processID]['TextExtraction']['public']['privateEvents']

        cleaned_publicEvents = []
        for elem in publicEvents:
            if str(elem['eventName']) not in cleaned_publicEvents:
                cleaned_publicEvents.append(str(elem['eventName']))
        max = 0
        for elem in cleaned_publicEvents:
            if ((elem[0] == 'e') and elem[-1].isdigit()):
                if int(elem.replace('e', '')) > max:
                    max = int(elem.replace('e', ''))
        mapping = []
        for ele in toreformat:
            # reformat node, (and later reformat edges)
            max = max+1
            activityName = str(ele['data']['name'].split(' ')[1]).capitalize()
            src = str(ele['data']['name'].split(' ')[0])
            tgt = str(ele['data']['name'].split(' ')[2])
            event = 'e'+str(max)+'['+activityName+' src='+src+' tgt='+tgt+']'

            choreo.append(event)
            mapping.append({
                'old_id': str(ele['data']['id']),
                'new_id': 'e'+str(max)
            })

        ###### add edges ##########
        for ele in newData:
            if ele['group'] == 'edges':
                line = ele['data']

                arrow = ''
                if 'condition' in line['id']:
                    arrow = '-->*'
                elif 'response_back' in line['id']:
                    pass
                elif 'response' in line['id']:
                    arrow = '*-->'
                elif 'milestone' in line['id']:
                    arrow = '--<>'
                elif 'include' in line['id']:
                    arrow = '-->+'
                elif 'exclude' in line['id']:
                    arrow = '-->%'
                else:
                    pass
                    # print('NA')

                src = cleanActivityId(line['source'], mapping)
                tgt = cleanActivityId(line['target'], mapping)

                if arrow != '':
                    newLine = src+' '+arrow+' '+tgt
                    edges.append(newLine)

        ###### add public keys ########
        addresses = []
        for elem in publicEvents:
            newA = 'pk[role='+elem['role']+']='+elem['address']
            if(newA not in addresses):
                addresses.append(str(newA))

        # merge all and project
        projText = addresses+choreo+private+edges

        # step2: generate local projection (data and vect)
        target = '../../client/src/projections/'
        dataPath = '../../client/src/projections/dcrTexts.json'
        this_folder = os.path.dirname(os.path.abspath(__file__))

        projRole_fromLocalRequest(processID, projText, target, roleID, roleNum)

        dataJson = loadJSONFile(projDBPath)
        dataJson[processID][roleNum] = {
            'data': loadJSONFile(os.path.join(target, 'temp_data'+roleNum+'.json')),
            'exec': dataJson[processID][roleNum]['exec'],
            'vect': loadJSONFile(os.path.join(target, 'temp_vect'+roleNum+'.json')),
            'init': {
                'data': loadJSONFile(os.path.join(target, 'temp_data'+roleNum+'.json')),
                'vect': loadJSONFile(os.path.join(target, 'temp_vect'+roleNum+'.json'))
            }
        }

        dataJson['projType'] = 'g_to_p'  # to check

        dumpJSONFile(projDBPath, dataJson)

        os.remove(os.path.join(
            this_folder, '../src/projections/temp_data'+roleNum+'.json'))
        os.remove(os.path.join(
            this_folder, '../src/projections/temp_vect'+roleNum['id']+'.json'))
        os.remove(os.path.join(this_folder, '../src/projections/temp_local.json'))

        return 'ok', 200, {'Access-Control-Allow-Origin': '*'}

    except:
        return 'nope', 500, {'Access-Control-Allow-Origin': '*'}


@app.route('/switchProj', methods=['GET', 'POST'])
def switchProj():
    """
    switches current projection for an alternative one at the demand of the local tenant (public change). 
    """

    # retrieve post data
    data = request.get_json(silent=True)
    processID = data['processID']
    projID = data['projID']
    roleMapping = getRoleMapping(processID, projID)
    reqHash = data['reqHash']

    # open db
    # projDBPath='../../client/src/projections/DCR_Projections.json'
    dataProj = loadJSONFile(projDBPath)

    # update proj
    # print(dataProj[processID][roleMapping['id']].keys())
    dataProj[processID][roleMapping['id']
                        ]['data'] = dataProj[processID][roleMapping['id']]['v_upd']['data']
    dataProj[processID][roleMapping['id']
                        ]['vect'] = dataProj[processID][roleMapping['id']]['v_upd']['vect']

    dataProj[processID][roleMapping['id']]['init'] = {
        'data': dataProj[processID][roleMapping['id']]['v_upd']['data'],
        'vect': dataProj[processID][roleMapping['id']]['v_upd']['vect']
    }

    dataProj[processID]['hash'] = reqHash

    # clean db and save
    dataProj[processID][roleMapping['id']].pop('v_upd', None)
    dumpJSONFile(projDBPath, dataProj)

    return 'ok', 200, {'Access-Control-Allow-Origin': '*'}


@app.route('/updMyHash', methods=['GET', 'POST'])
def updMyHash():
    reqHash = str(request.form['reqHash'])
    processID = str(request.form['processID'])
    dataJson = loadJSONFile(projDBPath)
    dataJson[processID]['hash'] = reqHash
    dumpJSONFile(projDBPath, dataJson)
    return 'ok', 200, {'Access-Control-Allow-Origin': '*'}


@app.errorhandler(404)
def not_found(e):
    return app.send_static_file('index.html')


if __name__ == "__main__":
    app.secret_key = os.urandom(24)
    app.run(debug=True, host="0.0.0.0", use_reloader=False)
