from flask import Blueprint
from routes.auth.logIn import app as logInApp
from routes.auth.logOut import app as logOutApp

app = Blueprint("RouteAuth", __name__)
app.register_blueprint(logInApp)
app.register_blueprint(logOutApp)
