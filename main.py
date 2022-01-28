from flask import Flask, request, redirect
from routes import app as routes
from datetime import datetime, timedelta
from secrets import token_hex
from flask_compress import Compress
import os
from dotenv import load_dotenv

app = Flask(
    __name__,
    template_folder="views"
)

app.register_blueprint(
    routes
)
load_dotenv()  # Load .env file from local system (for development)
app.secret_key = token_hex()
app.config["WEB_CONFIG"] = os.environ["WEB_CONFIG"]
app.config["API_PREFIX"] = os.environ["API_PREFIX"]
Compress(app)


@app.before_request
def before_request():
    # Only runs when on heroku and url starts with http
    if 'DYNO' in os.environ and request.url.startswith('http://'):
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)


@app.after_request
def on_request(response):
    if(request.path.startswith("/static")):
        expiry_time = datetime.utcnow() + timedelta(7)
        response.headers["Expires"] = expiry_time.strftime(
            "%a, %d %b %Y %H:%M:%S GMT")

    return response
