from utils.functions import isInt,runAsyncTask
from utils.db import database
from flask import request,Blueprint,session,copy_current_request_context


api=Blueprint("addMember",__name__)

@api.route("/",methods=["POST"])
def addMember():
    
    
    if isInt(request.form.get("code")) and session.get("Name"):

        quizRef=database.collection(request.form.get("code").strip());

        ####################-------------MULTI THREADING VERIFICATIONS-------------####################
        
        verifications={
            "canJoin":None,
            "member":None
        }

        @copy_current_request_context
        def nameAvailable(state=[]):
            
            state.append(
                quizRef
                    .document("Members")
                    .collection("Members")
                    .document(session.get("Name"))
                    .get().exists
            )
            verifications.update({
                "member":
                (False,"Please enter a different name") if state[0]==True # error if exists
                else (True,"")
            })

        runAsyncTask(
            nameAvailable
        ) #is name available

        @copy_current_request_context
        def canJoin(state=[]):
            
            state.append(
                quizRef
                    .document("Questions")
                    .get()
            )
            if not state[0].exists:
                verifications.update({
                    "canJoin":
                    (False,"This quiz does not exist")
                })
            elif type(state[0].to_dict().get("activeQuestion"))==type(""):
                verifications.update({
                    "canJoin":
                    (False,"You cannot join the quiz now")
                })
            else:
                verifications.update({
                    "canJoin":
                    (True,"")
                })

        runAsyncTask(
            canJoin
        ) # is allowed to join

        while None in list(verifications.values()): # wait till threads have completed, while waiting check for any failed cases, if failed cases are found, alert user immediately
            values=verifications.values()
            for case in values:
                if case==None:continue
                if case[0] == False:
                    return {"success":False,"error":case[1]}

        for case in verifications.values():
            if case[0] == False:
                return {"success":False,"error":case[1]}
        
        runAsyncTask(
            quizRef
                .document("Members")
                .collection("Members")
                .document(session.get("Name"))
                .set,
            {"points":0,"finished":False}
        )
        return {"success":True,}

    else:
        return {"success":False,"error":"Parameters passed are incorrect"}