"""Module for MongoDBClient."""
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, PyMongoError
from tqdm import tqdm


class DBHandler():
    """
    This class handles the connection to MongoDB client, as well as CRUD operations
    relating to this connection.
    """

    def __init__(self):
        """
        Init method that defines the mongo client, and database.

        :param db_config: DataClientConfig that contains connection details.
        """
        load_dotenv()
        self.uri = os.getenv("MONGODB_URI")
        self.client = MongoClient(self.uri)
        self.db = self.client[os.getenv("DB_NAME")]

        # Ping the MongoDB server to test the connection
        self.ping_server()

        # ensure index existed
        self.ensure_index()

    def ping_server(self):
        """
        Helper method that pings to the MongoDB server for connection test.
        """
        try:
            # Ping the server to test the connection
            self.client.admin.command('ping')
            print("ping(): Successfully connected to MongoDB server")
        except ConnectionFailure:
            print("ping(): Failed to connect to MongoDB server")
            raise  # Re-raise the exception to handle it outside

    def ensure_index(self):
        """
        Ensure that there is an index on the 'match_code' field in the 'scores' collection.
        If no such index exists, create it.
        """
        try:
            collection = self.db["scores"]

            # Get the list of existing indexes
            indexes = collection.list_indexes()

            # Check if an index on 'match_code' exists
            match_code_index_exists = False
            for index in indexes:
                if "match_code" in index["key"]:
                    match_code_index_exists = True
                    break

            # If index does not exist, create it
            if not match_code_index_exists:
                collection.create_index("match_code")
                print("ensure_match_code_index(): Index on 'match_code' created.")
            else:
                print("ensure_match_code_index(): Index on 'match_code' already exists.")

        except (ConnectionFailure, PyMongoError) as e:
            print(f"ensure_match_code_index(): Error ensuring index on 'match_code': {e}")
            raise

    def load_data(self, collection_name, filter_criteria=None):
        """
        Method that loads specified collection or documents matching filter criteria from the connection source.

        :param collection_name: String of collection name to load documents from.
        :param filter_criteria: Optional dictionary specifying filter criteria to load specific documents.
                                If not provided, all documents in the collection will be loaded.
        :return: Collection of data from the MongoDB source.
        """

        try:
            if collection_name in self.db.list_collection_names():
                print(f"load_data(): Collection '{collection_name}' exists.")
            else:
                print(
                    f"load_data(): Collection '{collection_name}' does not exist.")
                return []  # Return an empty list if the collection doesn't exist

            collection = self.db[collection_name]

            # If filter_criteria is provided, load data matching the filter
            if filter_criteria:
                data = list(collection.find(filter_criteria))
            else:
                # Load all data if no filter is provided
                data = list(collection.find())

            return data

        except (ConnectionFailure, PyMongoError) as e:
            print(f"load_data(): Error loading data from MongoDB: {e}")
            raise

    def insert_data(self, collection_name, data):
        try:
            if collection_name in self.db.list_collection_names():
                print(f"insert_data(): Collection '{collection_name}' exists.")
            else:
                print(
                    f"insert_data(): Collection '{collection_name}' does not exist. New collection will be created.")

            collection = self.db[collection_name]
            collection.insert_one(data)

        except (ConnectionFailure, PyMongoError) as e:
            print(f"upsert_data(): Error inserting data into MongoDB: {e}")
            raise

    def upsert_data(self, collection_name, data, key_field: str = '_id'):
        """
        Method that stores the data into the specified collection based on the connection source.

        :param data: Data to store into MongoDB source.
        :param collection_name: Name of collection to update and insert from.
        :param key_field: key id specified for MongoDB.
        :return: Collection of data from the MongoDB source.
        """

        try:
            if collection_name in self.db.list_collection_names():
                print(f"upsert_data(): Collection '{collection_name}' exists.")
            else:
                print(
                    f"upsert_data(): Collection '{collection_name}' does not exist. New collection will be created.")

            collection_name = self.db[collection_name]
            for document in tqdm(data, desc="Writing to mongoDB", unit="document"):
                collection_name.update_one(
                    {key_field: document[key_field]},
                    {'$set': document},
                    upsert=True
                )

        except (ConnectionFailure, PyMongoError) as e:
            print(f"upsert_data(): Error inserting data into MongoDB: {e}")
            raise

    def delete_data(self, collection_name, filter_criteria):
        """
        Method that deletes documents from the specified collection based on a filter.

        :param collection_name: Name of the collection from which to delete documents.
        :param filter_criteria: Dictionary specifying the filter criteria to match documents for deletion
            (e.g., {"age": {"$gt": 30}} to delete documents where age is greater than 30).
        :return: Number of deleted documents.
        """
        try:
            if collection_name in self.db.list_collection_names():
                print(f"delete_data(): Collection '{collection_name}' exists.")
            else:
                print(
                    f"delete_data(): Collection '{collection_name}' does not exist.")
                return 0  # No documents to delete if collection doesn't exist

            collection_name = self.db[collection_name]

            # Delete documents matching the filter criteria
            result = collection_name.delete_many(filter_criteria)

            print(f"delete_data(): {result.deleted_count} documents deleted.")
            return result.deleted_count

        except (ConnectionFailure, PyMongoError) as e:
            print(f"delete_data(): Error deleting data from MongoDB: {e}")
            raise

    def close(self):
        """
        Method to close connection to current Mongo Client.
        """
        self.client.close()
