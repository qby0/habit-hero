import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Варианты анимации для разных страниц
const getPageVariants = (path) => {
  // Базовые варианты анимации
  const baseVariants = {
    initial: { 
      opacity: 0,
      y: 20,
    },
    animate: { 
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: { 
        duration: 0.3,
        ease: "easeIn" 
      }
    }
  };

  // Специфические варианты для разных маршрутов
  switch (true) {
    case path === '/':
      return baseVariants;
    case path.startsWith('/habits/'):
      return {
        ...baseVariants,
        initial: { opacity: 0, scale: 0.95 },
        animate: { 
          opacity: 1, 
          scale: 1,
          transition: { 
            duration: 0.5,
            ease: "easeOut"
          }
        },
        exit: { 
          opacity: 0, 
          scale: 1.05,
          transition: { 
            duration: 0.3,
            ease: "easeIn" 
          }
        }
      };
    case path === '/profile':
      return {
        ...baseVariants,
        initial: { opacity: 0, x: 50 },
        animate: { 
          opacity: 1, 
          x: 0,
          transition: { 
            duration: 0.4,
            ease: "easeOut"
          }
        },
        exit: { 
          opacity: 0, 
          x: -50,
          transition: { 
            duration: 0.3,
            ease: "easeIn" 
          }
        }
      };
    case path === '/achievements':
      return {
        ...baseVariants,
        initial: { opacity: 0, y: 50, rotateX: 10 },
        animate: { 
          opacity: 1, 
          y: 0,
          rotateX: 0,
          transition: { 
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1]
          }
        },
        exit: { 
          opacity: 0, 
          y: -30,
          transition: { 
            duration: 0.3,
            ease: "easeIn" 
          }
        }
      };
    case path.startsWith('/workshop'):
      return {
        ...baseVariants,
        initial: { opacity: 0, x: -30 },
        animate: { 
          opacity: 1, 
          x: 0,
          transition: { 
            duration: 0.4,
            ease: "easeOut"
          }
        },
        exit: { 
          opacity: 0, 
          x: 30,
          transition: { 
            duration: 0.3,
            ease: "easeIn" 
          }
        }
      };
    default:
      return baseVariants;
  }
};

// Компонент для анимированного перехода страниц
const PageTransition = ({ children }) => {
  const location = useLocation();
  const variants = getPageVariants(location.pathname);

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
};

// Компонент для анимации элементов страницы
export const FadeIn = ({ children, delay = 0, duration = 0.5 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: {
          delay: delay,
          duration: duration,
          ease: "easeOut"
        }
      }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition; 