import os
import oracledb
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    conn = oracledb.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        dsn=os.getenv("DB_DSN")
    )
    return conn