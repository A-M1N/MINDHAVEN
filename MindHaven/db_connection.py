import pymongo

url = "mongodb+srv://mindhaven:mindhaven@cluster0.zqzqy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = pymongo.MongoClient(url)

db = client["mindhaven"]
