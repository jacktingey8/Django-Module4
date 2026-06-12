import sqlite3
conn = sqlite3.connect('db.sqlite3')
c = conn.cursor()
try:
    c.execute('SELECT id, text, x, y FROM myapp_sharedmessage')
    rows = c.fetchall()
    print(rows)
except Exception as e:
    print('ERR', e)
finally:
    conn.close()
