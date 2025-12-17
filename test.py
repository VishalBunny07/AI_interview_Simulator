import psycopg2
try:
    conn = psycopg2.connect("postgresql://postgres:Vishal_9097@localhost:5432/ai_interview")
    print("✅ Database connection successful!")
    conn.close()
except Exception as e:
    print(f"❌ Error: {e}")