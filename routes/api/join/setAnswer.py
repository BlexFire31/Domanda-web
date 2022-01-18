from utils.db import database
from flask import Blueprint,session,request,copy_current_request_context
from utils.functions import runAsyncTask,isInt
from utils.question import allOptionsList

api = Blueprint("setAnswer",__name__)


@api.route("/set",methods=["POST"])
def setAnswer():
    
    
    if(
        isInt(request.form.get("code")) and
        session.get("Name") and
        request.form.get("option") in allOptionsList and 
        isInt(request.form.get("question"))
    ):# Checking whether required params are passed and correct

        quizRef=database.collection(request.form.get("code").strip())

        ####################-------------MULTI THREADING VERIFICATIONS-------------####################
        
        verifications={
            "isNotFinished":None,
            "hasJoined":None,
            "hasNotAttempted":None
        }

        @copy_current_request_context
        def hasNotAttempted(state=[]):
            
            state.append(
                quizRef
                    .document("Questions")
                    .collection(request.form.get("question").strip())
                    .document("Answers")
                    .collection("Answers")
                    .document(session.get("Name"))
                    .get().exists
            )
            verifications.update({
                "hasNotAttempted":
                (False,"You have already attempted this question") if state[0]==True # error if exists
                else (True,"")
            })

        runAsyncTask(
            hasNotAttempted
        ) # name is in Members collection

        @copy_current_request_context
        def isNotFinished(state=[]):
            
            state.append(
                quizRef
                    .document("Questions")
                    .collection(request.form.get("question").strip())
                    .document("QuestionData")
                    .get()
            )
            if not state[0].exists:
                verifications.update({
                    "isNotFinished":
                    (False,"This Quiz/Question does not exist")
                })
            elif state[0].to_dict().get("finished") == True:
                verifications.update({
                    "isNotFinished":
                    (False,"You cannot answer now")
                })
            else:
                verifications.update({
                    "isNotFinished":
                    (True,"")
                })

        runAsyncTask(
            isNotFinished
        ) # question has not finished

        @copy_current_request_context
        def hasJoined(state=[]):
            
            state.append(
                quizRef
                    .document("Members")
                    .collection("Members")
                    .document(session.get("Name"))
                    .get().exists
            )
            verifications.update({
                "hasJoined":
                (False,"You haven't joined the quiz yet") if state[0]==False # error if does not exists
                else (True,"")
            })

        runAsyncTask(
            hasJoined
        ) # name is in Members collection


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
                .document("Questions")
                .collection(request.form.get("question").strip())
                .document("Answers")
                .collection("Answers")
                .document(session.get("Name"))
                .set,
            {"option":request.form.get("option")}
        );

        return {"success":True,}
  
    else:
        return {"success":False,"error":"Parameters passed are incorrect"}

