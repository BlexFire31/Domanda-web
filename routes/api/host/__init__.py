from flask import Blueprint
from routes.api.host.getStatus import api as getStatusApi
from routes.api.host.hostAll import api as hostAllApi
from routes.api.host.hostSingle import api as hostSingleApi

app = Blueprint("ApiHost",__name__)
app.register_blueprint(getStatusApi)
app.register_blueprint(hostAllApi)
app.register_blueprint(hostSingleApi)