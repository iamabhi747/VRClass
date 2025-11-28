from flask import Flask
from routes.api import api
from routes.db import init_db

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///vrclass.db'
app.register_blueprint(api, url_prefix='/api')

init_db(app)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000)