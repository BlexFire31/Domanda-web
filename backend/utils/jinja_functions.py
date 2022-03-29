import os
import pathlib
from uuid import uuid4

from flask import current_app


def insert_file_contents(file_path_with_public_as_root):
    path = pathlib.Path(__file__)
    root = path.parent.parent
    static = root.joinpath("frontend", "public")
    file_path = static.joinpath(file_path_with_public_as_root)

    file_reader = open(str(file_path), 'r')
    file_contents = file_reader.read()
    file_reader.close()
    return file_contents


def cache_bust():
    if current_app.debug:
        return str(uuid4())
    return os.environ.get("CACHE_BUST_UUID")


functions = {
    "insert_file_contents": insert_file_contents,
    "cache_bust": cache_bust
}
