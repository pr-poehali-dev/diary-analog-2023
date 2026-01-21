import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для работы с оценками: получение, выставление (только учителя)'''
    
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
            query_params = event.get('queryStringParameters', {}) or {}
            student_id = query_params.get('student_id')
            
            if not student_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'student_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT 
                    s.id, s.name, s.icon,
                    COALESCE(ARRAY_AGG(g.grade ORDER BY g.date DESC) FILTER (WHERE g.grade IS NOT NULL), ARRAY[]::INTEGER[]) as grades,
                    COALESCE(ROUND(AVG(g.grade)::NUMERIC, 2), 0) as average
                FROM subjects s
                LEFT JOIN grades g ON s.id = g.subject_id AND g.student_id = %s
                GROUP BY s.id, s.name, s.icon
                ORDER BY s.name
            """, (student_id,))
            
            subjects = cur.fetchall()
            
            subjects_list = [
                {
                    'id': s[0],
                    'name': s[1],
                    'icon': s[2],
                    'grades': list(s[3]) if s[3] else [],
                    'average': float(s[4]) if s[4] else 0
                }
                for s in subjects
            ]
            
            cur.execute("""
                SELECT 
                    u.id, u.full_name, u.avatar_emoji,
                    COALESCE(ROUND(AVG(g.grade)::NUMERIC, 2), 0) as score
                FROM users u
                LEFT JOIN grades g ON u.id = g.student_id
                WHERE u.role = 'student'
                GROUP BY u.id, u.full_name, u.avatar_emoji
                HAVING COUNT(g.id) > 0
                ORDER BY score DESC
            """)
            
            leaderboard = cur.fetchall()
            leaderboard_list = [
                {
                    'id': l[0],
                    'name': l[1],
                    'avatar': l[2],
                    'score': float(l[3]) if l[3] else 0,
                    'rank': idx + 1
                }
                for idx, l in enumerate(leaderboard)
            ]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'subjects': subjects_list, 'leaderboard': leaderboard_list}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            student_id = body.get('student_id')
            subject_id = body.get('subject_id')
            grade = body.get('grade')
            teacher_id = body.get('teacher_id')
            
            if not all([student_id, subject_id, grade, teacher_id]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Все поля обязательны'}),
                    'isBase64Encoded': False
                }
            
            if grade < 2 or grade > 5:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Оценка должна быть от 2 до 5'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "INSERT INTO grades (student_id, subject_id, grade, teacher_id) VALUES (%s, %s, %s, %s) RETURNING id",
                (student_id, subject_id, grade, teacher_id)
            )
            grade_id = cur.fetchone()[0]
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'grade_id': grade_id}),
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
