from flask import flash,Blueprint,render_template,abort
from utils.db import database
from utils.functions import isInt


app=Blueprint("home",__name__)

@app.route("/<code>")
@app.route("/")
def HomePage(code=None):
    if(code!=None and not isInt(code)): #doing this so that when they go to /quiz or /randompage they should see 404
        abort(404)

    if(
        isInt(code)
        and not database
            .collection(code)
            .document("Host")
            .get()
            .exists# When code is passed in url checking whether that quiz exists
    ):
        flash("This quiz does not exist");
        code=None; #Setting code to None so that it does'nt appear in the textbox in home.html

    return render_template("home.html",code=code)