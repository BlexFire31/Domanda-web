from flask import Flask, request
from routes import app as routes
import logging
import datetime
from secrets import token_hex
from flask_compress import Compress
import os
from dotenv import load_dotenv


# TODO FIX THE WAY CLIENTS GET ACCESS TO QUESTIONS
app = Flask(
    __name__,
    template_folder="views"
)

app.register_blueprint(
    routes
)
load_dotenv() # Load .env file from local system (for development)
app.secret_key = token_hex()
app.config["WEB_CONFIG"] = os.environ["WEB_CONFIG"]
Compress(app)

logging.basicConfig(level=logging.INFO)
logging.info(f"Domanda server started at {datetime.datetime.now()}")


@app.after_request
def on_request(response):
    if(request.path.startswith("/static")):
        expiry_time = datetime.datetime.utcnow() + datetime.timedelta(7)
        response.headers["Expires"] = expiry_time.strftime(
            "%a, %d %b %Y %H:%M:%S GMT")
        logging.info(f"Resource {request.path}")
    else:
        logging.info(
            f"[{datetime.datetime.now()}] {request.method} {request.path} [{response.status}]")

    return response

# app.run()
