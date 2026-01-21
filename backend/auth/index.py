import json
import os
import psycopg2
import hashlib
import random
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    '''API для авторизации с разными ролями: ученик (СМС), учитель (логин/пароль), директор (специальный номер)'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action')
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if action == 'send_sms':
            phone = body.get('phone', '').strip()
            role = body.get('role', 'student')
            
            if not phone:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Телефон обязателен'}),
                    'isBase64Encoded': False
                }
            
            if role == 'director' and phone != '+79999999999':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Роль директора доступна только владельцу'}),
                    'isBase64Encoded': False
                }
            
            code = str(random.randint(100000, 999999))
            expires_at = datetime.now() + timedelta(minutes=5)
            
            cur.execute(
                "INSERT INTO sms_codes (phone, code, expires_at) VALUES (%s, %s, %s)",
                (phone, code, expires_at)
            )
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'code': code, 'message': f'Код отправлен: {code}'}),
                'isBase64Encoded': False
            }
        
        elif action == 'verify_sms':
            phone = body.get('phone', '').strip()
            code = body.get('code', '').strip()
            role = body.get('role', 'student')
            full_name = body.get('full_name', '')
            class_name = body.get('class_name', '')
            
            cur.execute(
                "SELECT id FROM sms_codes WHERE phone = %s AND code = %s AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
                (phone, code)
            )
            code_record = cur.fetchone()
            
            if not code_record:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный или истёкший код'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("UPDATE sms_codes SET used = TRUE WHERE id = %s", (code_record[0],))
            
            cur.execute("SELECT id, role, full_name, class_name, avatar_emoji FROM users WHERE phone = %s", (phone,))
            user = cur.fetchone()
            
            if user:
                user_data = {
                    'id': user[0],
                    'phone': phone,
                    'role': user[1],
                    'full_name': user[2],
                    'class_name': user[3],
                    'avatar_emoji': user[4]
                }
            else:
                if not full_name:
                    full_name = f'Ученик {phone[-4:]}'
                
                cur.execute(
                    "INSERT INTO users (phone, role, full_name, class_name) VALUES (%s, %s, %s, %s) RETURNING id, role, full_name, class_name, avatar_emoji",
                    (phone, role, full_name, class_name)
                )
                new_user = cur.fetchone()
                user_data = {
                    'id': new_user[0],
                    'phone': phone,
                    'role': new_user[1],
                    'full_name': new_user[2],
                    'class_name': new_user[3],
                    'avatar_emoji': new_user[4]
                }
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'user': user_data}),
                'isBase64Encoded': False
            }
        
        elif action == 'login_teacher':
            username = body.get('username', '').strip()
            password = body.get('password', '').strip()
            
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Логин и пароль обязательны'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            cur.execute(
                "SELECT id, phone, role, full_name, class_name, avatar_emoji FROM users WHERE username = %s AND password_hash = %s AND role = 'teacher'",
                (username, password_hash)
            )
            user = cur.fetchone()
            
            cur.close()
            conn.close()
            
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный логин или пароль'}),
                    'isBase64Encoded': False
                }
            
            user_data = {
                'id': user[0],
                'phone': user[1],
                'role': user[2],
                'full_name': user[3],
                'class_name': user[4],
                'avatar_emoji': user[5]
            }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'user': user_data}),
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
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
