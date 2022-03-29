import os

from flask import abort, flash, redirect, render_template, url_for
from utils.has_code import has_code
from requests import get


@has_code(property_name="code", redirect_endpoint="routes.index")
def page(code: int):
    response = get(os.environ.get("API_URL")+f"/quiz/{code}/exists")
    if not response.ok:
        return abort(response.status_code)

    exists: bool = response.json().get("result")
    if not exists:
        flash("That quiz does not exist")
        return redirect(url_for("routes.index"))

    return render_template("join.jinja")
