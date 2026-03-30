import oracledb

def get_connection():
    conn = oracledb.connect(
        user="system",
        password="12345678",
        dsn="localhost:1521/XE"
    )
    return conn