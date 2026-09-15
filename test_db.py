from sqlalchemy import create_engine, text


DATABASE_URL = "postgresql+psycopg2://postgres:ZoroDLost01@localhost:5432/aegis_h2o"

engine = create_engine(DATABASE_URL)


try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT version();"))
        version = result.fetchone()[0]

        print("PostgreSQL connection successful!")
        print("Database:", "aegis_h2o")
        print("Server:", version)

except Exception as e:
    print("Database connection failed!")
    print("Error:", e)