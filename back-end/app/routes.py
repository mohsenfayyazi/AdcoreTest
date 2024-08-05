from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from sklearn.preprocessing import OneHotEncoder
from . import mongo
from .utils import mongo_to_json
from datetime import datetime
import pandas as pd

main = Blueprint('main', __name__)

@main.route('/courses', methods=['GET'])
def get_courses():
    course_id = request.args.get('_id')
    university_name = request.args.get('university_name')
    search_text = request.args.get('search', '')

    if course_id:
        try:
            course = mongo.db.courses.find_one({'_id': ObjectId(course_id)})
            if course:
                return jsonify(mongo_to_json(course))
            else:
                return jsonify({'status': 'error', 'message': 'Course not found'}), 404
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)}), 400

    query = {}
    if university_name:
        query['university_name'] = university_name
    if search_text:
        query['$text'] = {'$search': search_text}

    # Retrieve all courses matching the query
    courses = mongo.db.courses.find(query)
    result = [mongo_to_json(course) for course in courses]
    return jsonify(result)

@main.route('/courses/<course_id>', methods=['PUT'])
def update_course(course_id):
    data = request.get_json()
    result = mongo.db.courses.update_one({'_id': ObjectId(course_id)}, {'$set': data})
    if result.matched_count > 0:
        return jsonify({'status': 'success', 'modified_count': result.modified_count}), 200
    else:
        return jsonify({'status': 'error', 'message': 'Course not found'}), 404

@main.route('/courses/<course_id>', methods=['DELETE'])
def delete_course(course_id):
    result = mongo.db.courses.delete_one({'_id': ObjectId(course_id)})
    if result.deleted_count > 0:
        return jsonify({'status': 'success'}), 200
    else:
        return jsonify({'status': 'error', 'message': 'Course not found'}), 404

def normalize_data(data):
    data['timestamp'] = pd.to_datetime('now')
    categorical_columns = ['University', 'City', 'Country', 'CourseName', 'CourseDescription', 'Currency']
    encoder = OneHotEncoder(sparse_output=False, drop='first')
    encoded_cats = encoder.fit_transform(data[categorical_columns])
    encoded_cat_columns = encoder.get_feature_names_out(categorical_columns)
    encoded_df = pd.DataFrame(encoded_cats, columns=encoded_cat_columns)
    data = pd.concat([data, encoded_df], axis=1)
    return data

@main.route('/courses', methods=['POST'])
def create_course():
    data = request.get_json()
    data['timestamp'] = datetime.utcnow()  # Add the current UTC timestamp

    # Convert the data to DataFrame
    df = pd.DataFrame([data])
    
    # Normalize the data
    normalized_data = normalize_data(df)
    
    # Convert back to dictionary
    normalized_dict = normalized_data.to_dict(orient='records')[0]
    return jsonify({'status': 'success', 'id': 'dfsf'}), 201

    result = mongo.db.courses.insert_one(normalized_dict)
    if result.inserted_id:
        return jsonify({'status': 'success', 'id': str(result.inserted_id)}), 201
    else:
        return jsonify({'status': 'error', 'message': 'Failed to create course'}), 400


@main.route('/courses', methods=['OPTIONS'])
def courses_options():
    return jsonify({'status': 'success'}), 200

@main.route('/course/<course_id>', methods=['GET'])
def get_course(course_id):
    try:
        print(f"Fetching course with ID: {course_id}")  # Add logging

        # Ensure the ID is a valid ObjectId
        if not ObjectId.is_valid(course_id):
            print(f"Invalid ObjectId: {course_id}")
            return jsonify({'status': 'error', 'message': 'Invalid course ID'}), 400

        course = mongo.db.courses.find_one({'_id': ObjectId(course_id)})
        if course is not None:
            print(f"Course found: {course}")
            return jsonify(mongo_to_json(course))
        else:
            print("Course not found")  # Add logging
            return jsonify({'status': 'error', 'message': 'Course not found'}), 404
    except Exception as e:
        print(f"Error: {str(e)}")  # Add logging
        return jsonify({'status': 'error', 'message': str(e)}), 400
