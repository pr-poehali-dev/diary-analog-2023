import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';

type Subject = {
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

type UserRole = 'student' | 'teacher' | 'director' | null;

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'role' | 'phone' | 'otp'>('role');
  const [userRole, setUserRole] = useState<UserRole>(null);

  const mockSubjects: Subject[] = [
    { name: 'Математика', grades: [5, 4, 5, 5, 4], average: 4.6, icon: 'Calculator' },
    { name: 'Русский язык', grades: [5, 5, 4, 5], average: 4.75, icon: 'BookOpen' },
    { name: 'История', grades: [4, 5, 5, 4, 5], average: 4.6, icon: 'Scroll' },
    { name: 'Физика', grades: [5, 5, 5, 4], average: 4.75, icon: 'Atom' },
    { name: 'Английский', grades: [5, 4, 4, 5], average: 4.5, icon: 'Languages' },
  ];

  const mockLeaderboard: Student[] = [
    { id: 1, name: 'Анна Смирнова', avatar: '🏆', score: 4.89, rank: 1 },
    { id: 2, name: 'Иван Петров', avatar: '🥈', score: 4.82, rank: 2 },
    { id: 3, name: 'Мария Козлова', avatar: '🥉', score: 4.78, rank: 3 },
    { id: 4, name: 'Ты', avatar: '😊', score: 4.65, rank: 4 },
    { id: 5, name: 'Дмитрий Волков', avatar: '👨‍🎓', score: 4.61, rank: 5 },
  ];

  const totalAverage = (mockSubjects.reduce((sum, s) => sum + s.average, 0) / mockSubjects.length).toFixed(2);

  const handlePhoneSubmit = () => {
    if (phone.length >= 10) {
      setStep('otp');
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    setStep('phone');
  };

  const handleOtpComplete = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      setTimeout(() => {
        setIsAuthenticated(true);
      }, 500);
    }
  };

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
              {step === 'role' ? 'Выбери свою роль' : 'Войди через СМС-код'}
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
                  <Button onClick={handlePhoneSubmit} className="w-full" size="lg">
                    Получить код
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
                    <InputOTP maxLength={6} value={otp} onChange={handleOtpComplete}>
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
          <Button variant="ghost" size="icon">
            <Icon name="User" size={20} />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
                    <div className="text-4xl font-bold text-secondary">4</div>
                    <div className="text-sm text-muted-foreground">Место в рейтинге</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-accent/10">
                    <div className="text-4xl font-bold text-accent">23</div>
                    <div className="text-sm text-muted-foreground">Оценки за неделю</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Последние оценки</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSubjects.slice(0, 3).map((subject, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grades" className="space-y-4 animate-fade-in">
            {mockSubjects.map((subject, idx) => (
              <Card key={idx} className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Icon name={subject.icon as any} size={24} className="text-primary" />
                      </div>
                      <div>
                        <CardTitle>{subject.name}</CardTitle>
                        <CardDescription>Средний балл: {subject.average}</CardDescription>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-primary">{subject.average}</div>
                  </div>
                </CardHeader>
                <CardContent>
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
                <div className="space-y-3">
                  {mockLeaderboard.map((student) => (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02] ${
                        student.name === 'Ты'
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4 animate-fade-in">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Статистика успеваемости</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Пятёрки</span>
                    <span className="text-sm text-muted-foreground">65%</span>
                  </div>
                  <Progress value={65} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Четвёрки</span>
                    <span className="text-sm text-muted-foreground">30%</span>
                  </div>
                  <Progress value={30} className="h-3" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Тройки</span>
                    <span className="text-sm text-muted-foreground">5%</span>
                  </div>
                  <Progress value={5} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Достижения</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-accent/10">
                    <div className="text-4xl mb-2">🏅</div>
                    <div className="text-sm font-medium">Отличник</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-primary/10">
                    <div className="text-4xl mb-2">📚</div>
                    <div className="text-sm font-medium">Книголюб</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-secondary/10">
                    <div className="text-4xl mb-2">⭐</div>
                    <div className="text-sm font-medium">Звезда</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 animate-fade-in">
            <Card className="glass-card overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
              <CardHeader className="text-center">
                <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-5xl mb-4">
                  😊
                </div>
                <CardTitle className="text-2xl">Иван Иванов</CardTitle>
                <CardDescription>10 класс • Средний балл: {totalAverage}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Телефон</span>
                    <span className="font-medium">{phone || '+7 (999) 123-45-67'}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Класс</span>
                    <span className="font-medium">10А</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">Место в рейтинге</span>
                    <span className="font-medium">#4</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Icon name="LogOut" size={18} className="mr-2" />
                  Выйти
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;