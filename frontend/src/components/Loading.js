import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Paper, Container, Grow, Fade } from '@mui/material';
import { useTranslation } from 'react-i18next';

const Loading = ({ message = 'Loading...' }) => {
  const { t } = useTranslation();
  const [tip, setTip] = useState(0);
  
  // Массив советов по привычкам
  const habitTips = [
    'Начните с маленьких, но регулярных шагов. Постепенно увеличивайте сложность.',
    'Отмечайте свой прогресс каждый день. Визуализация успехов – мощная мотивация.',
    'Привяжите новую привычку к существующей рутине. Это поможет запомнить.',
    'При срыве не критикуйте себя. Просто продолжите на следующий день.',
    'Используйте правило 2 минут: начните с очень простого действия.',
    'Делитесь своими достижениями с друзьями для дополнительной мотивации.',
    'Создайте окружение, которое помогает, а не мешает вашим привычкам.',
    'Вознаграждайте себя за каждую серию успешных дней.',
    'Отслеживайте свои триггеры и преодолевайте их осознанно.',
    'Визуализируйте свой успех и то, как привычка меняет вашу жизнь.'
  ];

  // Английские советы
  const habitTipsEn = [
    'Start with small, regular steps. Gradually increase difficulty.',
    'Track your progress every day. Visualizing success is powerful motivation.',
    'Tie a new habit to an existing routine. This helps with remembering.',
    'Don\'t criticize yourself when you slip. Just continue the next day.',
    'Use the 2-minute rule: start with a very simple action.',
    'Share your achievements with friends for extra motivation.',
    'Create an environment that helps, not hinders, your habits.',
    'Reward yourself for each series of successful days.',
    'Track your triggers and overcome them consciously.',
    'Visualize your success and how the habit changes your life.'
  ];

  // Украинские советы
  const habitTipsUk = [
    'Починайте з маленьких, але регулярних кроків. Поступово збільшуйте складність.',
    'Відзначайте свій прогрес щодня. Візуалізація успіхів – потужна мотивація.',
    'Прив\'яжіть нову звичку до існуючої рутини. Це допоможе запам\'ятати.',
    'При зриві не критикуйте себе. Просто продовжуйте наступного дня.',
    'Використовуйте правило 2 хвилин: почніть з дуже простої дії.',
    'Діліться своїми досягненнями з друзями для додаткової мотивації.',
    'Створіть оточення, яке допомагає, а не заважає вашим звичкам.',
    'Винагороджуйте себе за кожну серію успішних днів.',
    'Відстежуйте свої тригери і долайте їх свідомо.',
    'Візуалізуйте свій успіх і те, як звичка змінює ваше життя.'
  ];

  // Словацкие советы
  const habitTipsSk = [
    'Začnite s malými, ale pravidelnými krokmi. Postupne zvyšujte obtiažnosť.',
    'Sledujte svoj pokrok každý deň. Vizualizácia úspechu je silná motivácia.',
    'Spojte nový návyk s existujúcou rutinou. Pomôže to s pamätaním.',
    'Nekritizujte sa, keď zlyhávate. Jednoducho pokračujte na ďalší deň.',
    'Použite 2-minútové pravidlo: začnite veľmi jednoduchú akciu.',
    'Zdieľajte svoje úspechy s priateľmi pre extra motiváciu.',
    'Vytvorte prostredie, ktoré pomáha, nie bráni vašim návykom.',
    'Odmeňte sa za každú sériu úspešných dní.',
    'Sledujte svoje spúšťače a prekonávajte ich vedome.',
    'Vizualizujte svoj úspech a ako návyk mení váš život.'
  ];

  // Выбор правильного массива советов в зависимости от языка
  const getTips = () => {
    const lang = localStorage.getItem('i18nextLng') || 'ru';
    switch(lang) {
      case 'en':
        return habitTipsEn;
      case 'uk':
        return habitTipsUk;
      case 'sk':
        return habitTipsSk;
      default:
        return habitTips;
    }
  };

  // Смена совета каждые 5 секунд
  useEffect(() => {
    const tips = getTips();
    const interval = setInterval(() => {
      setTip(prevTip => (prevTip + 1) % tips.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
        backgroundColor: 'background.default',
        padding: 3
      }}
    >
      <Grow in={true} timeout={800}>
        <Paper 
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 2,
            maxWidth: 600,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'background.paper',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: 4, 
            background: 'linear-gradient(90deg, #7c4dff 0%, #c33dff 100%)',
            animation: 'progress 2s infinite linear',
            '@keyframes progress': {
              '0%': { transform: 'translateX(-100%)' },
              '100%': { transform: 'translateX(100%)' }
            }
          }} />
          
          <CircularProgress size={80} thickness={4} color="primary" />
          
          <Typography variant="h5" sx={{ mt: 3, mb: 1, fontWeight: 'bold', color: 'text.primary' }}>
            {message}
          </Typography>
          
          <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Fade key={tip} in={true} timeout={500}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'primary.light', 
                color: 'primary.contrastText',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="body1" align="center" sx={{ fontStyle: 'italic' }}>
                  <strong>{t('habits.tip')}:</strong> {getTips()[tip]}
                </Typography>
              </Box>
            </Fade>
          </Container>
        </Paper>
      </Grow>
    </Box>
  );
};

export default Loading; 