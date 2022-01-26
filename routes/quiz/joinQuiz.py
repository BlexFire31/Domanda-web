
from uuid import uuid4
from utils.db import database
from flask import Blueprint, request, copy_current_request_context, redirect, url_for, flash, render_template
from utils.functions import runAsyncTask, isInt, validateName
from utils.routes import URI_KEYS
from utils.web_tokens import createJWT

app = Blueprint("joinQuiz", __name__)


@app.route("/join", methods=["POST"])
def JoinQuizPage():

    isNameOk, error = validateName(request.form.get("Name"))

    if (request.form.get("Name") and isNameOk):

        ####################-------------MULTI THREADING VERIFICATIONS-------------####################

        verifications = {
            "exists": None,
            "attempted": None,
        }

        @copy_current_request_context
        def quizExists(state=[]):
            state.append(
                database
                .collection(request.form.get("code").strip())
                .document("Host")
                .get()
                .exists
            )
            verifications.update({
                "exists":
                (True, "") if state[0]
                else (False, "This quiz does not exist")
            }
            )
        runAsyncTask(quizExists)  # check whether quiz exists

        @copy_current_request_context
        def nameTaken(state: list = []):
            @copy_current_request_context
            def memberExists():
                state.append(
                    database
                    .collection(request.form.get("code").strip())
                    .document("Members")
                    .collection("Members")
                    .document(request.form.get("Name"))
                    .get().exists
                )
            runAsyncTask(memberExists)

            @copy_current_request_context
            def lobbyExists():
                state.append(
                    database
                    .collection(request.form.get("code").strip())
                    .document("Lobby")
                    .collection("Lobby")
                    .document(request.form.get("Name"))
                    .get().exists
                )
            runAsyncTask(lobbyExists)
            while len(state) != 2:  # while threads are in progress check the status of completed threads
                if(True in state):  # Exists in either members or lobby
                    verifications.update({
                        "attempted":
                        (False, "Please enter a different name")
                    })
                    return

            if(True in state):  # once all threads have finished, do last check
                verifications.update({
                    "attempted":
                    (False, "Please enter a different name")
                })
            else:
                verifications.update({
                    "attempted":
                    (True, "")
                })

        runAsyncTask(nameTaken)  # name has already been taken

        while None in verifications.values():  # wait till threads are done and if threads are done check whether any tests failed, if failed, immediately notify user

            for case in verifications.values():
                if case == None:
                    continue  # case is incomplete
                if not case[0]:  # case has failed
                    flash(case[1])
                    return redirect(url_for(URI_KEYS.get("HOME")))

        for case in verifications.values():  # once all threads are done, do final check

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
            code=request.form.get("code").strip(),
            token=createJWT(uuid4(), request.form.get("Name"))
        )

    else:
        flash(error if error != None else "Parameters sent are incorrect")
        return redirect(url_for(URI_KEYS.get("HOME")))
