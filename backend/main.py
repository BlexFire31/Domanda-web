
from flask import Flask, request, redirect
from routes import blueprint
from secrets import token_hex
from flask_compress import Compress
import os
from dotenv import load_dotenv
from utils.jinja_functions import functions
from uuid import uuid4
from htmlmin import minify

app = Flask(
    __name__,
    template_folder="../frontend/templates",
    static_folder="../frontend/public"
)

# Add routes
app.register_blueprint(
    blueprint
)
Compress(app)

# Configure app properties
load_dotenv()  # Load .env file from local system (for development)
app.secret_key = token_hex()
app.config["WEB_CONFIG"] = os.environ["WEB_CONFIG"]
app.config["API_URL"] = os.environ["API_URL"]
app.jinja_env.globals.update(**functions)
os.environ["CACHE_BUST_UUID"] = str(uuid4())

# Intercept routes


@app.before_request
def before_request():
    # Only runs when on heroku and url starts with http
    if 'DYNO' in os.environ and request.url.startswith('http://'):
        url = request.url.replace('http://', 'https://', 1)
        return redirect(url, code=301)


@app.after_request
def add_cache_control(response):
    if(request.path.startswith("/static")):
        expires_in_days = 5
        expires_in_seconds = expires_in_days*24*60*60
        response.headers["Cache-Control"] = f"max-age:{expires_in_seconds}"
    return response


@app.after_request
def response_minify(response):
    """
    minify html response to decrease site traffic
    """
    if response.content_type == u'text/html; charset=utf-8':
        response.set_data(
            minify(response.get_data(as_text=True))
        )

        return response
    return response
