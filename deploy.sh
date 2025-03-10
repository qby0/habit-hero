#!/bin/bash

# Скрипт для пересборки контейнеров, сохранения базы данных и загрузки изменений на GitHub
# Автор: Claude
# Дата: 2025-03-10

# Цвета для удобства чтения
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Директория для резервных копий
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="mongodb_backup_${TIMESTAMP}.gz"

# Создаем директорию для резервных копий, если она не существует
if [ ! -d "$BACKUP_DIR" ]; then
  echo -e "${BLUE}Создание директории для резервных копий...${NC}"
  mkdir -p "$BACKUP_DIR"
fi

# Функция для вывода сообщений
log_message() {
  echo -e "${GREEN}[$(date +"%Y-%m-%d %H:%M:%S")] $1${NC}"
}

# Функция для вывода ошибок
log_error() {
  echo -e "${RED}[$(date +"%Y-%m-%d %H:%M:%S")] ОШИБКА: $1${NC}"
}

# Функция для создания резервной копии MongoDB
backup_mongodb() {
  log_message "Создание резервной копии базы данных MongoDB..."
  
  # Проверяем, работает ли контейнер с MongoDB
  if ! sudo docker ps | grep -q mongodb; then
    log_error "Контейнер MongoDB не запущен. Резервное копирование невозможно."
    return 1
  fi
  
  # Создаем резервную копию
  log_message "Сохранение базы данных в ${BACKUP_DIR}/${BACKUP_FILENAME}..."
  sudo docker exec mongodb sh -c 'mongodump --archive' | gzip > "${BACKUP_DIR}/${BACKUP_FILENAME}"
  
  if [ $? -eq 0 ]; then
    log_message "Резервная копия базы данных успешно создана."
  else
    log_error "Не удалось создать резервную копию базы данных."
    return 1
  fi
  
  return 0
}

# Функция для коммита и пуша изменений в GitHub
git_commit_and_push() {
  log_message "Подготовка изменений для загрузки на GitHub..."
  
  # Проверяем, есть ли изменения для коммита
  if [[ -z $(git status -s) ]]; then
    log_message "Нет изменений для коммита."
    return 0
  fi
  
  # Запрашиваем сообщение коммита
  echo -e "${YELLOW}Введите сообщение коммита (или нажмите Enter для сообщения по умолчанию):${NC}"
  read commit_message
  
  if [[ -z "$commit_message" ]]; then
    commit_message="Обновление приложения ${TIMESTAMP}"
  fi
  
  # Добавляем все изменения и коммитим
  git add .
  git commit -m "$commit_message"
  
  if [ $? -ne 0 ]; then
    log_error "Ошибка при создании коммита."
    return 1
  fi
  
  # Пушим изменения
  log_message "Загрузка изменений на GitHub..."
  git push
  
  if [ $? -eq 0 ]; then
    log_message "Изменения успешно загружены на GitHub."
  else
    log_error "Не удалось загрузить изменения на GitHub."
    return 1
  fi
  
  return 0
}

# Функция для пересборки и перезапуска контейнеров
rebuild_containers() {
  log_message "Пересборка и перезапуск контейнеров..."
  
  # Пересобираем контейнеры
  sudo docker-compose down
  sudo docker-compose build
  
  if [ $? -ne 0 ]; then
    log_error "Ошибка при сборке контейнеров."
    return 1
  fi
  
  # Запускаем контейнеры
  sudo docker-compose up -d
  
  if [ $? -eq 0 ]; then
    log_message "Контейнеры успешно пересобраны и запущены."
  else
    log_error "Не удалось запустить контейнеры."
    return 1
  fi
  
  return 0
}

# Основная логика скрипта
main() {
  echo -e "${BLUE}=========================================${NC}"
  echo -e "${BLUE}= Скрипт развертывания и резервного копирования =${NC}"
  echo -e "${BLUE}=========================================${NC}"
  
  # Выбор действия
  echo -e "${YELLOW}Выберите действие:${NC}"
  echo "1. Полный цикл (резервное копирование + загрузка на GitHub + пересборка контейнеров)"
  echo "2. Только резервное копирование базы данных"
  echo "3. Только загрузка изменений на GitHub"
  echo "4. Только пересборка контейнеров"
  echo "q. Выход"
  
  read -p "Ваш выбор: " choice
  
  case $choice in
    1)
      backup_mongodb
      backup_result=$?
      
      git_commit_and_push
      git_result=$?
      
      rebuild_containers
      containers_result=$?
      
      # Итоговый статус
      echo -e "${BLUE}=========================================${NC}"
      echo -e "Резервное копирование: $([ $backup_result -eq 0 ] && echo "${GREEN}УСПЕШНО${NC}" || echo "${RED}ОШИБКА${NC}")"
      echo -e "Загрузка на GitHub: $([ $git_result -eq 0 ] && echo "${GREEN}УСПЕШНО${NC}" || echo "${RED}ОШИБКА${NC}")"
      echo -e "Пересборка контейнеров: $([ $containers_result -eq 0 ] && echo "${GREEN}УСПЕШНО${NC}" || echo "${RED}ОШИБКА${NC}")"
      ;;
    2)
      backup_mongodb
      ;;
    3)
      git_commit_and_push
      ;;
    4)
      rebuild_containers
      ;;
    q)
      log_message "Выход из программы."
      exit 0
      ;;
    *)
      log_error "Некорректный выбор."
      ;;
  esac
  
  echo -e "${BLUE}=========================================${NC}"
  log_message "Работа скрипта завершена."
}

# Запуск скрипта
main 