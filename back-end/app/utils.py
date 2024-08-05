from bson.objectid import ObjectId
from . import mongo
from .config import Config
import pandas as pd
from datetime import datetime

def mongo_to_json(doc):
    doc['_id'] = str(doc['_id'])  # Convert ObjectId to string
    return doc
