
from utils.db import database
from flask import Blueprint,session,request,copy_current_request_context,redirect,url_for,flash,render_template
from utils.functions import runAsyncTask,isInt,validateName
from utils.routes import URI_KEYS

app=Blueprint("joinQuiz",__name__)

@app.route("/join",methods=["POST","GET"])
def JoinQuizPage():
    global verifications
    if request.method=="GET":
        flash("Please enter your name and quiz-code first")
        return redirect(url_for(URI_KEYS.get("HOME")))

    
    success, error = validateName(request.form.get("Name"))

    if request.form.get("Name") and request.form.get("Name").strip()!="":

        # Check whether name is allowed
        if(success):
            session["Name"]=request.form.get("Name").strip();

        else:
            # Otherwise show user the error
            flash(error);
            return redirect(url_for(URI_KEYS.get("HOME")))
    

    if (
        isInt(request.form.get("code"))
        and request.form.get("Name")
    ):# parameters passed are ok

        ####################-------------MULTI THREADING VERIFICATIONS-------------####################

        verifications={
            "exists":None,
            "attempted":None,
        }

        @copy_current_request_context
        def quizExists(state=[]):
            global verifications
            state.append(
                database
                    .collection(request.form.get("code").strip())
                    .document("Host")
                    .get()
                    .exists
            )
            verifications.update({
                "exists":
                (True,"") if state[0]
                else (False, "This quiz does not exist")
            }
            )
        runAsyncTask(quizExists) # check whether quiz exists

        @copy_current_request_context
        def nameTaken(state=[]):
            global verifications
            state.append(
                not database
                    .collection(request.form.get("code").strip())
                    .document("Members")
                    .collection("Members")
                    .document(request.form.get("Name"))
                    .get().exists 
            )
            verifications.update({
                "attempted":
                (True,"") if state[0]
                else (False, "Please enter a different name")
                }
            )
        runAsyncTask(nameTaken) # name has already been taken

        while None in verifications.values() : # wait till threads are done and if threads are done check whether any tests failed, if failed, immediately notify user
            
            for case in verifications.values():
                if case== None:continue # case is incomplete
                if not case[0]: # case has failed
                    flash(case[1])
                    return redirect(url_for(URI_KEYS.get("HOME")))

        for case in verifications.values(): # once all threads are done, do final check

            if not case[0]:
                flash(case[1])
                return redirect(url_for(URI_KEYS.get("HOME")))

        runAsyncTask(
            database
                .collection(request.form.get("code").strip())
                .document("Lobby")
                .collection("Lobby")
                .document(request.form.get("Name"))
                .set,
            {}
        )

        return render_template(
            "join.html",
            name=request.form.get("Name"),
            code=request.form.get("code").strip()
        )

    else:       
        flash("Parameters sent are incorrect") 
        return redirect(url_for(URI_KEYS.get("HOME")))
    
