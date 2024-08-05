from flask import Flask
from flask_pymongo import PyMongo
from .config import Config
from flask_cors import CORS
mongo = PyMongo()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    mongo.init_app(app)
    CORS(app, resources={r"/*": {"origins": "*"}})

    from .routes import main
    app.register_blueprint(main)

    return app