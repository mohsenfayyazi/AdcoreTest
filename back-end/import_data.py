import pandas as pd
import numpy as np
import requests
from pymongo import MongoClient, ASCENDING
from pymongo.errors import BulkWriteError
from sklearn.preprocessing import OneHotEncoder
from app.config import Config
import time

# MongoDB setup
client = MongoClient(Config.MONGO_URI)
db = client.get_database()
courses_collection = db.courses

# Ensure collection has a TTL index for expiration

def download_data():
    url = 'https://api.mockaroo.com/api/501b2790?count=100&key=8683a1c0'
    response = requests.get(url)
    if response.status_code == 200:
        with open('data/universityschema.csv', 'wb') as f:
            f.write(response.content)
        print("Data downloaded successfully.")
    else:
        print("Failed to download data.")
        response.raise_for_status()

def normalize_data(data):
    # Add a timestamp field for TTL index
    data['timestamp'] = pd.to_datetime('now')
    
    # Identify numeric and categorical columns
    categorical_columns = ['University', 'City', 'Country', 'CourseName', 'CourseDescription', 'Currency']
    
    # One-hot encode categorical columns
    encoder = OneHotEncoder(sparse_output=False, drop='first')
    encoded_cats = encoder.fit_transform(data[categorical_columns])
    encoded_cat_columns = encoder.get_feature_names_out(categorical_columns)
    
    # Create a DataFrame for encoded columns
    encoded_df = pd.DataFrame(encoded_cats, columns=encoded_cat_columns)
    
    # Concatenate the original DataFrame with the encoded columns
    data = pd.concat([data, encoded_df], axis=1)
    
    return data

def load_and_import_data():
    courses_collection.create_index([('timestamp', ASCENDING)], expireAfterSeconds=600)

    # Download data
    download_data()
    
    # Load data
    data = pd.read_csv('data/universityschema.csv')
    
    # Normalize data
    data = normalize_data(data)
    
    # Convert to dictionary and insert into MongoDB
    records = data.to_dict(orient='records')
    try:
        courses_collection.delete_many({})  # Clear existing data
        courses_collection.insert_many(records)
        print("Data imported successfully.")
    except BulkWriteError as bwe:
        print("Error during data import:", bwe.details)

if __name__ == '__main__':
    while True:
        load_and_import_data()
        print("Data will be refreshed in 10 minutes.")
        time.sleep(600)  # Sleep for 10 minutes before refreshing the data
