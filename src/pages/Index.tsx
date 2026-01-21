import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_AUTH = 'https://functions.poehali.dev/24ec72b0-bac1-4ea0-8f3c-5110f397eef5';
const API_GRADES = 'https://functions.poehali.dev/9b255984-0d15-4e55-b566-8ed83703ff8f';
const API_DIRECTOR = 'https://functions.poehali.dev/33d78bc8-e215-4b17-a292-d653a6f900cf';

type Subject = {
  id: number;
  name: string;
  grades: number[];
  average: number;
  icon: string;
};

type Student = {
  id: number;
  name: string;
  avatar: string;
  score: number;
  rank: number;
};

type User = {
  id: number;
  phone?: string;
  role: string;
  full_name: string;
  class_name?: string;
  avatar_emoji: string;
};

type UserRole = 'student' | 'teacher' | 'director' | null;

const Index = () => {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'role' | 'phone' | 'otp' | 'teacher-login'>('role');
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [leaderboard, setLeaderboard] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const loadGradesData = async (studentId: number) => {
    try {
      const res = await fetch(`${API_GRADES}?student_id=${studentId}`);
      const data = await res.json();
      if (data.subjects) setSubjects(data.subjects);
      if (data.leaderboard) setLeaderboard(data.leaderboard);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    if (role === 'teacher') {
      setStep('teacher-login');
    } else {
      setStep('phone');
    }
  };

  const handlePhoneSubmit = async () => {
    if (phone.length < 10) return;
    
    setLoading(true);
    try {
      const res = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_sms', phone, role: userRole })
      });
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Код отправлен!', description: `Ваш код: ${data.code}` });
        setStep('otp');
      } else {
        toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отправить код', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpComplete = async (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      setLoading(true);
      try {
        const res = await fetch(API_AUTH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'verify_sms', 
            phone, 
            code: value, 
            role: userRole,
            full_name: '',
            class_name: ''
          })
        });
        const data = await res.json();
        
        if (data.success && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          if (data.user.role === 'student') {
            loadGradesData(data.user.id);
          }
          toast({ title: 'Добро пожаловать!', description: data.user.full_name });
        } else {
          toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'Ошибка', description: 'Не удалось войти', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTeacherLogin = async () => {
    if (!username || !password) return;
    
    setLoading(true);
    try {
      const res = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login_teacher', username, password })
      });
      const data = await res.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        toast({ title: 'Добро пожаловать!', description: data.user.full_name });
      } else {
        toast({ title: 'Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось войти', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const totalAverage = subjects.length > 0 
    ? (subjects.reduce((sum, s) => sum + s.average, 0) / subjects.length).toFixed(2)
    : '0.00';

  const userRank = leaderboard.findIndex(s => s.id === user?.id) + 1;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary via-secondary to-accent">
        <Card className="w-full max-w-md glass-card animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4">
              <Icon name="GraduationCap" size={32} className="text-white" />
            </div>
            <CardTitle className="text-3xl">Электронный дневник</CardTitle>
            <CardDescription>
              {step === 'role' ? 'Выбери свою роль' : step === 'teacher-login' ? 'Вход для учителей' : 'Войди через СМС-код'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 'role' ? (
              <>
                <div className="space-y-3">
                  <Button
                    onClick={() => handleRoleSelect('student')}
                    className="w-full h-20 text-lg"
                    variant="outline"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Icon name="User" size={24} className="text-primary" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Ученик</div>
                        <div className="text-sm text-muted-foreground">Просмотр оценок и рейтинга</div>
                      </div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => handleRoleSelect('teacher')}
                    className="w-full h-20 text-lg"
                    variant="outline"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center">
                        <Icon name="BookOpenCheck" size={24} className="text-secondary" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Учитель</div>
                        <div className="text-sm text-muted-foreground">Выставление оценок</div>
                      </div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => handleRoleSelect('director')}
                    className="w-full h-20 text-lg"
                    variant="outline"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                        <Icon name="Crown" size={24} className="text-accent" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Директор</div>
                        <div className="text-sm text-muted-foreground">Полный доступ к системе</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </>
            ) : step === 'teacher-login' ? (
              <>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Логин</label>
                    <Input
                      type="text"
                      placeholder="Введите логин"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Пароль</label>
                    <Input
                      type="password"
                      placeholder="Введите пароль"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleTeacherLogin} className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Вход...' : 'Войти'}
                    <Icon name="ArrowRight" size={20} className="ml-2" />
                  </Button>
                  <Button variant="ghost" onClick={() => setStep('role')} className="w-full">
                    <Icon name="ArrowLeft" size={20} className="mr-2" />
                    Назад
                  </Button>
                </div>
              </>
            ) : step === 'phone' ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Номер телефона</label>
                  <Input
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Button onClick={handlePhoneSubmit} className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Отправка...' : 'Получить код'}
                    <Icon name="ArrowRight" size={20} className="ml-2" />
                  </Button>
                  <Button variant="ghost" onClick={() => setStep('role')} className="w-full">
                    <Icon name="ArrowLeft" size={20} className="mr-2" />
                    Изменить роль
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Введи код из СМС</label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={handleOtpComplete} disabled={loading}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep('role')} className="flex-1">
                    <Icon name="ArrowLeft" size={20} className="mr-2" />
                    Назад
                  </Button>
                  <Button variant="ghost" onClick={() => setStep('phone')} className="flex-1">
                    Изменить номер
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <Icon name="GraduationCap" size={24} className="text-white" />
            </div>
            <span className="font-bold text-xl">Дневник</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.full_name}</span>
            <Button variant="ghost" size="icon">
              <Icon name="User" size={20} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {user?.role === 'student' && (
          <Tabs defaultValue="home" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="home">
                <Icon name="Home" size={18} className="mr-2" />
                Главная
              </TabsTrigger>
              <TabsTrigger value="grades">
                <Icon name="BookMarked" size={18} className="mr-2" />
                Оценки
              </TabsTrigger>
              <TabsTrigger value="leaderboard">
                <Icon name="Trophy" size={18} className="mr-2" />
                Рейтинг
              </TabsTrigger>
              <TabsTrigger value="stats">
                <Icon name="BarChart3" size={18} className="mr-2" />
                Статистика
              </TabsTrigger>
              <TabsTrigger value="profile">
                <Icon name="User" size={18} className="mr-2" />
                Профиль
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="space-y-6 animate-fade-in">
              <Card className="glass-card overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
                <CardHeader>
                  <CardTitle className="text-2xl">Добро пожаловать! 👋</CardTitle>
                  <CardDescription>Твоя успеваемость на высоте</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 rounded-xl bg-primary/10">
                      <div className="text-4xl font-bold text-primary">{totalAverage}</div>
                      <div className="text-sm text-muted-foreground">Средний балл</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-secondary/10">
                      <div className="text-4xl font-bold text-secondary">{userRank || '-'}</div>
                      <div className="text-sm text-muted-foreground">Место в рейтинге</div>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-accent/10">
                      <div className="text-4xl font-bold text-accent">
                        {subjects.reduce((sum, s) => sum + s.grades.length, 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Всего оценок</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Последние оценки</CardTitle>
                </CardHeader>
                <CardContent>
                  {subjects.filter(s => s.grades.length > 0).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Оценок пока нет</p>
                  ) : (
                    <div className="space-y-3">
                      {subjects.filter(s => s.grades.length > 0).slice(0, 3).map((subject) => (
                        <div key={subject.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                              <Icon name={subject.icon as any} size={20} className="text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{subject.name}</div>
                              <div className="text-sm text-muted-foreground">Средняя: {subject.average}</div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {subject.grades.slice(-3).map((grade, gIdx) => (
                              <Badge key={gIdx} variant={grade === 5 ? 'default' : grade === 4 ? 'secondary' : 'outline'}>
                                {grade}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grades" className="space-y-4 animate-fade-in">
              {subjects.map((subject) => (
                <Card key={subject.id} className="glass-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Icon name={subject.icon as any} size={24} className="text-primary" />
                        </div>
                        <div>
                          <CardTitle>{subject.name}</CardTitle>
                          <CardDescription>Средний балл: {subject.average || 'Нет оценок'}</CardDescription>
                        </div>
                      </div>
                      {subject.average > 0 && (
                        <div className="text-3xl font-bold text-primary">{subject.average}</div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {subject.grades.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">Оценок пока нет</p>
                    ) : (
                      <>
                        <div className="flex gap-2 flex-wrap">
                          {subject.grades.map((grade, gIdx) => (
                            <Badge
                              key={gIdx}
                              variant={grade === 5 ? 'default' : grade === 4 ? 'secondary' : 'outline'}
                              className="text-lg px-4 py-2"
                            >
                              {grade}
                            </Badge>
                          ))}
                        </div>
                        <Progress value={(subject.average / 5) * 100} className="mt-4" />
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-4 animate-fade-in">
              <Card className="glass-card overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Icon name="Trophy" size={28} className="text-accent" />
                    Глобальный рейтинг
                  </CardTitle>
                  <CardDescription>Лучшие ученики школы</CardDescription>
                </CardHeader>
                <CardContent>
                  {leaderboard.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Рейтинг пока пуст</p>
                  ) : (
                    <div className="space-y-3">
                      {leaderboard.map((student) => (
                        <div
                          key={student.id}
                          className={`flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02] ${
                            student.id === user?.id
                              ? 'bg-gradient-to-r from-primary/20 to-secondary/20 border-2 border-primary'
                              : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`text-3xl font-bold ${student.rank <= 3 ? 'text-accent' : 'text-muted-foreground'}`}>
                              #{student.rank}
                            </div>
                            <div className="text-3xl">{student.avatar}</div>
                            <div>
                              <div className="font-semibold text-lg">{student.name}</div>
                              <div className="text-sm text-muted-foreground">Средний балл</div>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-primary">{student.score}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4 animate-fade-in">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Статистика успеваемости</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {subjects.reduce((sum, s) => sum + s.grades.length, 0) === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Оценок пока нет</p>
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Пятёрки</span>
                          <span className="text-sm text-muted-foreground">
                            {Math.round((subjects.reduce((sum, s) => sum + s.grades.filter(g => g === 5).length, 0) / subjects.reduce((sum, s) => sum + s.grades.length, 0)) * 100)}%
                          </span>
                        </div>
                        <Progress value={(subjects.reduce((sum, s) => sum + s.grades.filter(g => g === 5).length, 0) / subjects.reduce((sum, s) => sum + s.grades.length, 0)) * 100} className="h-3" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Четвёрки</span>
                          <span className="text-sm text-muted-foreground">
                            {Math.round((subjects.reduce((sum, s) => sum + s.grades.filter(g => g === 4).length, 0) / subjects.reduce((sum, s) => sum + s.grades.length, 0)) * 100)}%
                          </span>
                        </div>
                        <Progress value={(subjects.reduce((sum, s) => sum + s.grades.filter(g => g === 4).length, 0) / subjects.reduce((sum, s) => sum + s.grades.length, 0)) * 100} className="h-3" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Тройки и двойки</span>
                          <span className="text-sm text-muted-foreground">
                            {Math.round((subjects.reduce((sum, s) => sum + s.grades.filter(g => g <= 3).length, 0) / subjects.reduce((sum, s) => sum + s.grades.length, 0)) * 100)}%
                          </span>
                        </div>
                        <Progress value={(subjects.reduce((sum, s) => sum + s.grades.filter(g => g <= 3).length, 0) / subjects.reduce((sum, s) => sum + s.grades.length, 0)) * 100} className="h-3" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4 animate-fade-in">
              <Card className="glass-card overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
                <CardHeader className="text-center">
                  <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-5xl mb-4">
                    {user?.avatar_emoji}
                  </div>
                  <CardTitle className="text-2xl">{user?.full_name}</CardTitle>
                  <CardDescription>{user?.class_name} • Средний балл: {totalAverage}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Телефон</span>
                      <span className="font-medium">{user?.phone}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Класс</span>
                      <span className="font-medium">{user?.class_name || 'Не указан'}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Место в рейтинге</span>
                      <span className="font-medium">#{userRank || '-'}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => { setIsAuthenticated(false); setUser(null); }}>
                    <Icon name="LogOut" size={18} className="mr-2" />
                    Выйти
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {user?.role === 'teacher' && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Панель учителя</CardTitle>
              <CardDescription>Функционал в разработке</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Здесь будет интерфейс для выставления оценок</p>
            </CardContent>
          </Card>
        )}

        {user?.role === 'director' && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Панель директора</CardTitle>
              <CardDescription>Управление системой</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Здесь будет панель создания учителей и управления системой</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Index;
