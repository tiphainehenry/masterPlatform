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
from src.projalgoGlobal import projectGlobal
from src.projalgoPublic import projectPublic
from src.projalgoRoles import projRole, projRole_fromLocalRequest
from src.utils.formatting import removeGroups,getChoreographyDetails
from src.utils.vectorization import getRelationElems
from src.utils.chunking import getRoles, getRoleMapping
from src.utils.graphManager import executeNode, executeApprovedNode, execLogg, initializeGraph, retrieveMarkingOnId

from src.utils.chunking import extractChunks, getLinkages,applyComposition, getRoles, getRoleMapping

from src.utils.vectorization import vectorizeRole, vectorizeRoleFromCyto

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('HELLO WORLD')
app = Flask(__name__, static_folder='../build', static_url_path='/')
cors = CORS(app, resources={r"*": {"origins": "*"}})
api = Api(app)

projDBPath='../../client/src/projections/DCR_Projections.json'


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

    roleMapping = getRoleMapping(processID,role)
    return roleMapping['id']

def updWithName(dataTxt, pi, projType):
    """
    generates projections from textual representation

    :param dataTxt: text input to project
    :param pi: process id to be generated. eg: 'p1'
    """ 

    target = '../../client/src/projections/'
    dataPath = '../../client/src/projections/dcrTexts.json'
    this_folder = os.path.dirname(os.path.abspath(__file__))
    # target = os.path.join(this_folder, '..\src\projections\\')
    # dataPath = os.path.join(this_folder, '..\src\projections\dcrTexts.json')
    #print("target datapath")
    #print(target)
    #print(dataPath)

    _data = removeGroups(dataTxt)
    #print("2/ updWithName  -----------------------")
    #print(dataTxt)
    projectGlobal(pi, dataTxt, target)

    dataDict = loadJSONFile(dataPath)
    dataDict['externalEvents'] = []
    dumpJSONFile(dataPath,dataDict)
    dumpJSONFile(os.path.join(target, 'temp_execPublic.json'),{"execLogs": []})


    for role in getRoles(pi):
        print('[INFO] Starting projection on role '+role)
        projRole(pi, dataTxt, target, role)
        dumpJSONFile(os.path.join(target, 'exec'+getId(pi,role)+'.json'),{"execLogs": []})

    projectPublic(pi, dataTxt, target)

    # merge all
    processData = {'id': pi}

    processData['TextExtraction'] = loadJSONFile(os.path.join(this_folder, '../src/projections/dcrTexts.json'))
    processData['Global'] = {
        'data': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_dataGlobal.json')),
        'vect': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_vectGlobal.json'))
    }
    processData['Public'] = {
        'data': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_dataPublic.json')),
        'exec': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_execPublic.json')),
        'vect': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_vectPublic.json'))
    }
    processData['projType']=projType

    for role in getRoles(pi):
        roleMapping = getRoleMapping(pi,role)
        #rolePath= os.path.join(this_folder, '../src/projections/temp_data'+roleMapping['id']+'.json')

        processData[roleMapping['id']] = {
            'data': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_data'+roleMapping['id']+'.json')),
            'exec': loadJSONFile(os.path.join(this_folder, '../src/projections/exec'+roleMapping['id']+'.json')),
            'vect': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_vect'+roleMapping['id']+'.json')),
            'init':{
                'data': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_data'+roleMapping['id']+'.json')),
                'vect': loadJSONFile(os.path.join(this_folder, '../src/projections/temp_vect'+roleMapping['id']+'.json'))
            }
        }

        os.remove(os.path.join(this_folder, '../src/projections/temp_data'+roleMapping['id']+'.json'))
        os.remove(os.path.join(this_folder, '../src/projections/temp_vect'+roleMapping['id']+'.json'))
        os.remove(os.path.join(this_folder, '../src/projections/exec'+roleMapping['id']+'.json'))

    ## savethis_folder
    dataJson = loadJSONFile(projDBPath)    
    dataJson['p'+str(len(dataJson)+1)] = processData
    dumpJSONFile(projDBPath,dataJson)

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

        execLogg(role,processID,activity_name_details, status, start_timestamp, data)

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
    processID=data['processID']
    role = data['projId']
    data = data['data']

    if ('rejected' in status):
        # update execLog
        role_id = getId(processID,role)
        
        #pExec = glob.glob('../../client/src/projections/exec'+role_id+'*')[0]
        execLogg(role,processID, activity_name_details, status, start_timestamp, data)

    else:

        dataPath='../../client/src/projections/DCR_Projections.json'
        with open(dataPath) as json_file:
            dataJson = json.load(json_file)

        #Update public projection
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

        execLogg('Public',processID, activity_name_details,
                     'public node - ' + status, start_timestamp,data)

        

        #Update roles
        for role in getRoles(processID):
            roleMapping = getRoleMapping(processID,role)

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
            execLogg(role,processID, activity_name_details,
                     'public node - ' + status, start_timestamp,data)




    return status, 200, {'Access-Control-Allow-Origin': '*'}


#@app.route('/reinit', methods=['POST', 'GET'])
#def reinitialise():
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

        #Update public projection
        #publicData = dataJson[processID]['TextExtraction']['public']

        # step1: enrich private events and relations --> scan all. If not matching: then add relation. 
        localChunks, localRoles = extractChunks(localData)
        localRelations = []
        roleIds = []

        localEvents=[] 
        
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

        addresses=[]
        for elem in publicData['privateEvents']:
            newA = 'pk[role='+elem['role']+']='+elem['address']
            if(newA not in addresses):
                addresses.append(str(newA))

        localEvents = list(set(localEvents))        
        projText=addresses+localEvents+localRelations

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
            'init':{
                'data': loadJSONFile(os.path.join(target, 'temp_data'+roleNum+'.json')),
                'vect': loadJSONFile(os.path.join(target, 'temp_vect'+roleNum+'.json'))
            }
        }

        dataJson['projType']='p_to_g'

        dumpJSONFile(projDBPath,dataJson)

        os.remove(os.path.join(this_folder, '../src/projections/temp_data'+roleNum+'.json'))
        os.remove(os.path.join(this_folder, '../src/projections/temp_vect'+roleNum['id']+'.json'))
        os.remove(os.path.join(this_folder, '../src/projections/temp_local.json'))

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
        dataProj[processID]['hash']=processHash
        dumpJSONFile(projDBPath,dataProj)

        return 'ok', 200, {'Access-Control-Allow-Origin': '*'}

    except: 
        return 'nope', 500, {'Access-Control-Allow-Origin': '*'}

@app.route('/inputFile', methods=['GET', 'POST'])
def inputFileLaunch():
    """
    reads input dcr textual representation 
    """ 
    try:
        file = request.files['file']
        data = file.readlines()
        print("-----------------------------------")
        processID = str(request.form['processID'])
        projType = str(request.form['projType'])

        updWithName(data, processID, projType)

        return 'ok', 200, {'Access-Control-Allow-Origin': '*'}

    except:
        return 'nope', 500, {'Access-Control-Allow-Origin': '*'}

@app.route('/delete', methods=['GET', 'POST'])
def delete():
    """
    deletes a process 
    """ 

    data = request.get_json(silent=True)
    processID = data['processID']

    #projDBPath='../../client/src/projections/DCR_Projections.json'

    dataProj = loadJSONFile(projDBPath)
    dataProj.pop(processID, None)
    dumpJSONFile(projDBPath, dataProj)

    return 'ok', 200, {'Access-Control-Allow-Origin': '*'}


@app.route('/deleteAll', methods=['GET', 'POST'])
def deleteAll():
    """
    deletes all process instances! 
    """ 

    #projDBPath='../../client/src/projections/DCR_Projections.json'
    dumpJSONFile(projDBPath,{})

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

    #vectorize
    vect = vectorizeRoleFromCyto(processID, projID, newData)

    #initialize and clean nodes, remove class duplicates. 
    markings=vect['markings']
    updProj=[]

    for elem in newData:
        if elem['group'] == 'nodes':
            # filter out external events
            if (('classes' not in elem.keys()) or ('external' not in elem['classes'])):
                elemMarking = retrieveMarkingOnId(markings, elem)

                if(len(elemMarking) != 0):
                    if (elemMarking['include'] == 1):
                        elem['classes']=elem['classes']+ 'included executable'

        updProj.append(elem)

    #print(vect)

    newRoleProjection = {
        'data':updProj,
        'vect':vect,
        'exec':{
        "execLogs": []
      }
    }
    #pprint.pprint(newRoleProjection)

    #store
    #projDBPath='../../client/src/projections/DCR_Projections.json'
    dataProj = loadJSONFile(projDBPath)    
    dataProj[processID][projID]['v_upd'] = newRoleProjection
    dumpJSONFile(projDBPath,dataProj)

    return 'ok', 200, {'Access-Control-Allow-Origin': '*'}



@app.route('/switchProj', methods=['GET', 'POST'])
def switchProj():
    """
    switches current projection for an alternative one at the demand of the local tenant. 
    """ 
    
    #retrieve post data
    data = request.get_json(silent=True)
    processID = data['processID']
    projID = data['projID']
    roleMapping = getRoleMapping(processID,projID)

    #open db
    #projDBPath='../../client/src/projections/DCR_Projections.json'
    dataProj = loadJSONFile(projDBPath)
    
    #update proj
    #print(dataProj[processID][roleMapping['id']].keys())
    dataProj[processID][roleMapping['id']]['data']=dataProj[processID][roleMapping['id']]['v_upd']['data']
    dataProj[processID][roleMapping['id']]['vect']=dataProj[processID][roleMapping['id']]['v_upd']['vect']

    dataProj[processID][roleMapping['id']]['init']={
        'data':dataProj[processID][roleMapping['id']]['v_upd']['data'],
        'vect':dataProj[processID][roleMapping['id']]['v_upd']['vect']
    }

    
    #clean db and save
    dataProj[processID][roleMapping['id']].pop('v_upd', None)
    dumpJSONFile(projDBPath,dataProj)

    return 'ok', 200, {'Access-Control-Allow-Origin': '*'}



@app.errorhandler(404)
def not_found(e):
    return app.send_static_file('index.html')


if __name__ == "__main__":
    app.secret_key = os.urandom(24)
    app.run(debug=True, host="0.0.0.0", use_reloader=False)
