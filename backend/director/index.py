import json
import os
import psycopg2
import hashlib

def handler(event: dict, context) -> dict:
    '''API панели директора: создание учителей с логинами/паролями'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'GET':
            cur.execute("SELECT id, username, full_name, avatar_emoji, created_at FROM users WHERE role = 'teacher' ORDER BY created_at DESC")
            teachers = cur.fetchall()
            
            teachers_list = [
                {
                    'id': t[0],
                    'username': t[1],
                    'full_name': t[2],
                    'avatar_emoji': t[3],
                    'created_at': t[4].isoformat() if t[4] else None
                }
                for t in teachers
            ]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'teachers': teachers_list}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create_teacher':
                username = body.get('username', '').strip()
                password = body.get('password', '').strip()
                full_name = body.get('full_name', '').strip()
                avatar_emoji = body.get('avatar_emoji', '👨‍🏫')
                
                if not username or not password or not full_name:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Логин, пароль и имя обязательны'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                if cur.fetchone():
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Логин уже занят'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "INSERT INTO users (username, password_hash, role, full_name, avatar_emoji) VALUES (%s, %s, 'teacher', %s, %s) RETURNING id, username, full_name, avatar_emoji",
                    (username, password_hash, full_name, avatar_emoji)
                )
                teacher = cur.fetchone()
                conn.commit()
                
                teacher_data = {
                    'id': teacher[0],
                    'username': teacher[1],
                    'full_name': teacher[2],
                    'avatar_emoji': teacher[3]
                }
                
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'teacher': teacher_data}),
                    'isBase64Encoded': False
                }
            
            else:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неизвестное действие'}),
                    'isBase64Encoded': False
                }
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
