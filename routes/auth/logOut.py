from flask import session,Blueprint,redirect,url_for

from utils.routes import URI_KEYS

app=Blueprint("logOut",__name__)

@app.route("/logOut")
def LogoutPage():
    
    session["Email"]=None
    session["Name"]=None
    session["PhotoUrl"]=None
    session["Uid"]=None

    return redirect(url_for(URI_KEYS.get("HOME")))