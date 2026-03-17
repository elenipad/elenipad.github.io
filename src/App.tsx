import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './App.css'
import { incrementCourseView } from './services/courseStats'

type Route =
  | {
      view: 'home'
      anchor?: string
      subview?: undefined
      topicIndex?: undefined
      mode?: undefined
      stepIndex?: undefined
    }
  | {
      view: 'event'
      id: string
      subview?: 'intro' | 'topic' | 'complete'
      topicIndex?: number
      mode?: string
      stepIndex?: number
    }

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void
  }
}

const METRIKA_ID = 107730080

const reachGoal = (name: string, params?: Record<string, unknown>) => {
  if (typeof window === 'undefined' || typeof window.ym !== 'function') return
  try {
    window.ym(METRIKA_ID, 'reachGoal', name, params)
  } catch {
    // ignore metric errors
  }
}

type Example = {
  input: string
  output?: string
}

type Step = {
  title: string
  theory: string
  practice?: string
  isSummary?: boolean
}

type Mode = {
  id: string
  title: string
  summary?: string
  theory?: string
  steps: Step[]
  notes?: string[]
  examples?: Array<Example | Example[]>
}

type Topic = {
  id: string
  title: string
  command?: string
  description?: string
  briefing?: string
  goal?: string
  modes: Mode[]
}

const topics: Topic[] = [
      {
        id: 'topic-clone',
        title: 'Клонирование и первичная настройка',
        command: 'git clone <repo>',
        description:
          'Подключение к удалённому репозиторию, выбор способа доступа и проверка локальной копии.',
        briefing:
          'Клонирование — это получение копии проекта с историей коммитов и привязка к удалённому серверу.',
        goal:
          'Выбрать способ доступа, склонировать проект и проверить связь с удалённым сервером.',
        modes: [
          {
            id: 'https',
            title: 'HTTPS',
            summary:
              'Подходит для старта: используется логин и персональный токен.',
            theory:
              'HTTPS удобен, но обычно требует токен вместо пароля. Git может запрашивать учётные данные при каждом доступе.',
            steps: [
              {
                title: 'Подготовьте адрес репозитория',
                theory:
                  'URL указывает Git, откуда брать код и историю проекта. Это основной адрес для связи с удалённым сервером.',
                practice: 'Скопируйте HTTPS-URL проекта из интерфейса хостинга.',
              },
              {
                title: 'Подготовьте PAT',
                theory:
                  'PAT заменяет пароль и предоставляет Git доступ к репозиторию. Обычно токен имеет срок действия и набор прав.',
                practice:
                  'Создайте токен в настройках хостинга и сохраните его в менеджере паролей.',
              },
              {
                title: 'Клонируйте репозиторий',
                theory:
                  'git clone создаёт локальную копию со всей историей коммитов. После этого вы можете работать с кодом офлайн.',
                practice: 'Выполните git clone https://github.com/academy/cli-notes.git.',
              },
              {
                title: 'Проверьте remote',
                theory:
                  'Remote показывает, к какому источнику привязана рабочая копия. Это важно для дальнейших pull/push.',
                practice: 'Откройте папку проекта и выполните git remote -v.',
              },
            ],
            notes: [
              'Если пароли отключены, используйте PAT.',
              'HTTPS полезен, когда SSH ещё не настроен.',
            ],
            examples: [
              {
                input: 'git clone https://github.com/academy/cli-notes.git',
                output:
                  "Cloning into 'cli-notes'...\nUsername for 'https://github.com': dev\nPassword for 'https://dev@github.com': [PAT]\nReceiving objects: 100% (42/42), done.",
              },
              {
                input: 'git remote -v',
                output:
                  'origin  https://github.com/academy/cli-notes.git (fetch)\norigin  https://github.com/academy/cli-notes.git (push)',
              },
            ],
          },
          {
            id: 'ssh',
            title: 'SSH',
            summary:
              'Надёжный путь: настраиваешь ключи один раз и работаешь без пароля.',
            theory:
              'SSH использует пару ключей. Публичный ключ добавляется в профиль хостинга, и доступ подтверждается автоматически.',
            steps: [
              {
                title: 'Создайте SSH-ключ',
                theory:
                  'SSH-ключ подтверждает вашу личность и убирает запрос пароля. Приватный ключ хранится локально и не передаётся.',
                practice:
                  'Сгенерируйте ключ командой ssh-keygen -t ed25519 -C "you@example.com".',
              },
              {
                title: 'Добавьте ключ в профиль',
                theory:
                  'Хостинг должен знать ваш публичный ключ, чтобы доверять соединению. Без этого доступ будет отклонён.',
                practice:
                  'Скопируйте ~/.ssh/id_ed25519.pub и добавьте в Settings → SSH Keys.',
              },
              {
                title: 'Проверьте доступ',
                theory:
                  'Проверка показывает, что платформа принимает ваш ключ. Это быстрый способ убедиться, что всё настроено.',
                practice: 'Выполните ssh -T git@github.com.',
              },
              {
                title: 'Настройте SSH-конфиг',
                theory:
                  'Если имя хоста отличается, запись в ~/.ssh/config связывает хост и ключ. Это защищает от ошибок при подключении.',
                practice:
                  'Добавьте Host github.com с параметрами HostName и IdentityFile.',
              },
              {
                title: 'Клонируйте по SSH',
                theory:
                  'git clone создаёт локальную копию со всей историей коммитов. SSH избавляет от повторного ввода паролей.',
                practice: 'Выполните git clone git@github.com:academy/cli-notes.git.',
              },
            ],
            notes: [
              'SSH требует ключ и запись в профиле хостинга.',
              'Если хост в URL отличается от SSH-конфига, соединение не установится.',
            ],
            examples: [
              {
                input: 'ssh -T git@github.com',
                output: 'Hi username! You\'ve successfully authenticated, but GitHub does not provide shell access.',
              },
              {
                input: 'git clone git@github.com:academy/cli-notes.git',
                output:
                  "Cloning into 'cli-notes'...\nremote: Enumerating objects: 42, done.\nremote: Counting objects: 100% (42/42), done.\nReceiving objects: 100% (42/42), done.",
              },
              {
                input: 'git remote -v',
                output:
                  'origin  git@github.com:academy/cli-notes.git (fetch)\norigin  git@github.com:academy/cli-notes.git (push)',
              },
            ],
          },
        ],
      },
      {
        id: 'topic-workflow',
        title: 'Рабочий цикл: статус, индекс, коммит',
        command: 'git status',
        description:
          'Проверка состояния репозитория, добавление файлов в индекс и фиксация изменений.',
        briefing:
          'Главная цель — научиться управлять изменениями осознанно и понимать, что именно попадёт в коммит.',
        goal:
          'Проверить статус, выбрать файлы для коммита и зафиксировать изменения с понятным сообщением.',
        modes: [
          {
            id: 'basic',
            title: 'Базовый цикл',
            summary: 'Статус, добавление в индекс, коммит и просмотр истории.',
            theory:
              'Git фиксирует только то, что добавлено в индекс. Поэтому сначала нужно проверить статус и осознанно выбрать файлы.',
            steps: [
              {
                title: 'Проверьте статус',
                theory:
                  'git status показывает изменённые, новые и удалённые файлы. Это ваш контрольный список.',
                practice: 'Выполните git status и отметьте, какие файлы готовы к коммиту.',
              },
              {
                title: 'Добавьте нужные файлы в индекс',
                theory:
                  'git add переносит выбранные изменения в индекс. Можно добавлять точечно, а не всё сразу.',
                practice: 'Добавьте один файл: git add docs/guide.md.',
              },
              {
                title: 'Проверьте индекс',
                theory:
                  'git status покажет, что именно попадёт в коммит. Это последняя проверка перед фиксацией.',
                practice: 'Снова выполните git status и убедитесь, что в staged нужные файлы.',
              },
              {
                title: 'Создайте коммит',
                theory:
                  'Сообщение коммита должно отражать суть изменения. Это помогает в истории проекта.',
                practice: 'Выполните git commit -m "Update guide with setup notes".',
              },
              {
                title: 'Просмотрите историю',
                theory:
                  'git log позволяет понять, какие изменения уже зафиксированы и кто их сделал.',
                practice: 'Выполните git log --oneline -5.',
              },
            ],
            notes: [
              'Не добавляйте в коммит лишние файлы.',
              'Используйте понятные сообщения коммитов.',
            ],
            examples: [
              {
                input: 'git status -sb',
                output: '## main\n M docs/guide.md\n?? drafts/checklist.md',
              },
              {
                input: 'git add docs/guide.md',
                output: '',
              },
              {
                input: 'git commit -m "Update guide with setup notes"',
                output:
                  '[main 3a1b9c2] Update guide with setup notes\n 1 file changed, 12 insertions(+)',
              },
              {
                input: 'git log --oneline -3',
                output:
                  '3a1b9c2 Update guide with setup notes\nc91f0ad Add initial guide\n9d10b44 Init project',
              },
            ],
          },
        ],
      },
      {
        id: 'topic-files',
        title: 'Работа с файловой системой',
        command: 'mkdir -p <dir>',
        description:
          'Создание структуры каталогов, перенос файлов по типам и проверка результата.',
        briefing:
          'Разберём базовые операции с каталогами и файлами: создание, перенос и проверку содержимого.',
        goal:
          'Научиться создавать директории, перемещать файлы по шаблону и проверять результат в каталоге.',
        modes: [
          {
            id: 'structure',
            title: 'Структура данных',
            summary: 'Каталоги, перенос файлов и проверка результата.',
            theory:
              'Когда файлы разложены по типам, любой участник команды быстро понимает, где искать конфиги и логи.',
            steps: [
                {
                  title: 'Создание директорий',
                  theory:
                    'Разберём команду `mkdir` и её аргументы: после команды идут пути к каталогам, которые нужно создать.\n```bash\nmkdir [OPTION] DIRECTORY\n```\nОпции:\n`-p`, `--parents` — не выдаёт ошибку, если каталог уже существует, и создаёт родительские директории при необходимости (их права не меняются опцией `-m`).\n```bash\nmkdir -p <directory>\n```\nФлаг `-p` создаёт все недостающие родительские директории и не ругается, если каталог уже существует.',
                  practice:
                    'Команда:\n```bash\nmkdir -p /opt\n```\nРазбор аргументов:\n- `-p` — создаёт все недостающие родительские папки и не ругается, если они уже есть.\n- `/opt` — путь к директории, которую нужно создать.\nИтог: появится папка `/opt` (если её не было).',
                },
                {
                  title: 'Перемещение файлов',
                  theory:
                    'Сначала разберём обычное перемещение одного файла: указываем источник и каталог назначения.\n```bash\nmv SOURCE DIRECTORY\n```\nДалее — перенос сразу группы файлов с маской.\n```bash\nmv SOURCE/*.type DIRECTORY\n```\nСимвол `*` — это подстановочный шаблон, который означает «любой набор символов». Например, `inbox/*.conf` выбирает все файлы с расширением `.conf`.\nКоманда переносит все файлы, подходящие под шаблон, в указанную папку.',
                  practice:
                    'Команда:\n```bash\nmv inbox/*.conf /opt/\n```\nРазбор аргументов:\n- `inbox/` — папка‑источник, где лежат файлы.\n- `*.conf` — шаблон: выберет все файлы с расширением `.conf`.\n- `/opt/` — каталог назначения.\nИтог: все `.conf` из `inbox/` окажутся в `/opt/`, в `inbox/` их больше не будет.',
                },
                {
                  title: 'Проверка содержимого',
                  theory:
                    'Разберём команду `ls` и ключ `-la`: он показывает полный список файлов, их права, владельца, размер и дату. Это помогает убедиться, что нужные файлы лежат на месте.\n```bash\nls -la /opt\n```',
                  practice:
                    'Команда:\n```bash\nls -la /opt\n```\nРазбор аргументов:\n- `-l` — подробный формат вывода (права, владелец, размер, дата).\n- `-a` — показывает скрытые файлы (например, `.` и `..`).\n- `/opt` — каталог, который проверяем.\nИтог: вы увидите список файлов в `/opt` и сможете убедиться, что перенос выполнен.',
                },
            ],
            notes: [
              'Держите входящие файлы отдельно от обработанных.',
              'Используйте осмысленные имена каталогов.',
            ],
            examples: [
              {
                input: 'mkdir -p /opt',
                output: '',
              },
              {
                input: 'mv inbox/*.conf /opt/',
                output: '',
              },
              [
                {
                  input: 'ls /opt',
                  output: 'containerd\nmoonlumevpn',
                },
                {
                  input: 'ls -la /opt',
                  output:
                    'total 16\ndrwxr-xr-x  4 root root 4096 Feb 28 20:18 .\ndrwxr-xr-x 18 root root 4096 Mar 11 05:19 ..\ndrwx--x--x  4 root root 4096 Feb 28 20:18 containerd\ndrwxr-xr-x  2 root root 4096 Feb 28 20:26 moonlumevpn',
                },
              ],
            ],
          },
        ],
      },
      {
        id: 'topic-process',
        title: 'Остановка процессов',
        command: 'pkill -f <name>',
        description:
          'Поиск процесса, корректное завершение и проверка результата.',
        briefing:
          'Важно уметь останавливать зависшие или ненужные процессы безопасно и быстро.',
        goal:
          'Найти процесс по имени, остановить его и убедиться, что он завершён.',
        modes: [
          {
            id: 'stop',
            title: 'Остановка',
            summary: 'Поиск, остановка и проверка.',
            theory:
              'Процесс можно завершить по имени или по PID. Сначала используйте мягкий сигнал, а принудительный — только если нужно.',
            steps: [
              {
                title: 'Найдите процесс',
                theory:
                  'ps и pgrep помогают увидеть, запущен ли процесс и какие у него PID.',
                practice: 'Выполните pgrep -af sync_worker.',
              },
              {
                title: 'Остановите по имени',
                theory:
                  'pkill -f завершает все процессы, в командной строке которых встречается строка.',
                practice: 'Выполните pkill -f sync_worker.',
              },
              {
                title: 'Проверьте результат',
                theory:
                  'Если процесс не найден, pgrep завершится с ошибкой — это нормально.',
                practice: 'Выполните pgrep -af sync_worker || echo "Process stopped".',
              },
              {
                title: 'Остановите по PID при необходимости',
                theory:
                  'kill отправляет сигнал конкретному PID. Это точнее, чем pkill.',
                practice: 'Выполните kill 12345.',
              },
              {
                title: 'Принудительная остановка',
                theory:
                  'SIGKILL (-9) используется только если процесс не реагирует на обычный сигнал.',
                practice: 'Выполните kill -9 12345.',
              },
            ],
            notes: [
              'Сначала используйте обычный kill или pkill.',
              'Проверяйте, что завершили нужный процесс.',
            ],
            examples: [
              {
                input: 'pgrep -af sync_worker',
                output:
                  '1420 /usr/local/bin/sync_worker --profile=main\n1598 /usr/local/bin/sync_worker --profile=sync',
              },
              {
                input: 'pkill -f sync_worker',
                output: '',
              },
              {
                input: 'pgrep -af sync_worker || echo "Process stopped"',
                output: 'Process stopped',
              },
              {
                input: 'kill 1420',
                output: '',
              },
              {
                input: 'kill -9 1598',
                output: '',
              },
            ],
          },
        ],
      },
      {
        id: 'topic-editor',
        title: 'Консольные редакторы: nano и vim',
        command: 'nano <file>',
        description:
          'Открытие конфигурации в консольном редакторе, правка и безопасное сохранение.',
        briefing:
          'В терминале часто нужно быстро поправить конфиг без графического редактора. Для этого используют nano или vim.',
        goal:
          'Открыть файл, внести правки, сохранить и корректно выйти из редактора.',
        modes: [
          {
            id: 'nano',
            title: 'Nano',
            summary: 'Простой редактор с подсказками клавиш.',
            theory:
              'Nano подходит для быстрого редактирования. Подсказки команд видны внизу экрана, выход и сохранение делаются сочетаниями с Ctrl.',
            steps: [
              {
                title: 'Откройте файл',
                theory:
                  'Команда nano открывает файл в редакторе, создавая его при необходимости.',
                practice: 'Выполните nano config/runtime.env.',
              },
              {
                title: 'Перейдите к строке',
                theory:
                  'Ctrl+_ позволяет быстро перейти к нужной строке.',
                practice: 'Нажмите Ctrl+_ и введите номер строки.',
              },
              {
                title: 'Внесите правку',
                theory:
                  'Редактирование происходит напрямую: удаляйте и печатайте текст.',
                practice: 'Измените значение параметра, например STATUS=OPEN.',
              },
              {
                title: 'Сохраните файл',
                theory:
                  'Ctrl+O записывает изменения на диск и спросит имя файла.',
                practice: 'Нажмите Ctrl+O и подтвердите сохранение Enter.',
              },
              {
                title: 'Выйдите из редактора',
                theory:
                  'Ctrl+X закрывает nano. Если есть несохранённые изменения, редактор спросит подтверждение.',
                practice: 'Нажмите Ctrl+X для выхода.',
              },
            ],
            notes: [
              'Команды nano отображаются внизу экрана.',
              'Ctrl+O — сохранить, Ctrl+X — выйти.',
            ],
            examples: [
              {
                input: 'nano config/runtime.env',
                output: '',
              },
              {
                input: 'Ctrl+O',
                output: 'File Name to Write: config/runtime.env',
              },
              {
                input: 'Ctrl+X',
                output: '',
              },
            ],
          },
          {
            id: 'vim',
            title: 'Vim',
            summary: 'Мощный редактор с режимами.',
            theory:
              'Vim работает в режимах: для ввода текста нужен режим вставки, а команды выполняются в обычном режиме.',
            steps: [
              {
                title: 'Откройте файл',
                theory:
                  'vim открывает файл и сразу переходит в обычный режим.',
                practice: 'Выполните vim config/runtime.env.',
              },
              {
                title: 'Перейдите в режим вставки',
                theory:
                  'Нажмите i, чтобы начать редактирование текста.',
                practice: 'Нажмите i и внесите изменения.',
              },
              {
                title: 'Вернитесь в обычный режим',
                theory:
                  'Esc завершает режим вставки и возвращает управление командам.',
                practice: 'Нажмите Esc.',
              },
              {
                title: 'Сохраните и выйдите',
                theory:
                  'Команда :wq сохраняет изменения и выходит из vim.',
                practice: 'Введите :wq и нажмите Enter.',
              },
            ],
            notes: [
              'Если нужно выйти без сохранения, используйте :q!.',
              'Статус режима виден внизу экрана.',
            ],
            examples: [
              {
                input: 'vim config/runtime.env',
                output: '',
              },
              {
                input: 'i',
                output: '-- INSERT --',
              },
              {
                input: ':wq',
                output: '',
              },
            ],
          },
        ],
      },
      {
        id: 'topic-keys',
        title: 'Поиск и удаление файлов',
        command: 'find fragments -name "*.key"',
        description:
          'Отбор нужных файлов по расширению и очистка папки от лишнего.',
        briefing:
          'Разберём, как находить нужные файлы по расширению и очищать директории от лишнего.',
        goal:
          'Освоить базовые инструменты фильтрации и очистки файлов в директориях.',
        modes: [
          {
              id: 'compose',
              title: 'Сборка',
              summary: 'Очистка и фильтрация.',
              theory:
                'Проще всего работать по расширениям: удалить всё лишнее и оставить только нужные файлы.',
              steps: [
                {
                  title: 'Поиск файлов',
                  theory:
                    'Разберём find: команда ищет файлы и папки по заданным условиям.\n```bash\nfind PATH [OPTIONS] [EXPRESSION]\n```\nРазбор аргументов на примере:\n```bash\nfind fragments -type f -maxdepth 1\n```\n- fragments — путь, где искать.\n- -type f — только файлы.\n- -maxdepth 1 — ограничение глубины (только текущая папка).\nВ результате мы получаем список файлов в fragments.',
                  practice:
                    'Команда:\n```bash\nfind fragments -type f -maxdepth 1\n```\nРазбор аргументов:\n- fragments — каталог, где ищем.\n- -type f — только файлы.\n- -maxdepth 1 — не заходить глубже первого уровня.\nИтог: вы увидите список файлов в fragments.',
                },
                  {
                    title: 'Удаление файлов',
                    theory:
                      'Разберём удаление через find с условием исключения.\n```bash\nfind PATH [OPTIONS] [EXPRESSION] -delete\n```\nРазбор аргументов на примере:\n```bash\nfind fragments -type f ! -name \"*.key\" -delete\n```\n- fragments — путь, где ищем.\n- -type f — только файлы.\n- ! -name \"*.key\" — исключает файлы с расширением .key.\n- -delete — удаляет найденные файлы.\nИтог: в папке останутся только файлы с расширением .key.',
                    practice:
                      'Команда:\n```bash\nfind fragments -type f ! -name \"*.key\" -delete\n```\nРазбор аргументов:\n- fragments — каталог, где ищем.\n- -type f — только файлы.\n- ! -name \"*.key\" — исключаем .key.\n- -delete — удаляем найденные файлы.\nИтог: остаются только .key файлы.',
                  },
                ],
            notes: [
              'Удаляйте только то, что не нужно.',
              'Проверяйте порядок объединения фрагментов.',
            ],
              examples: [
                {
                  input: 'find fragments -type f -maxdepth 1',
                  output:
                    'fragments/part-a.key\nfragments/part-b.key\nfragments/readme.txt\nfragments/tmp.bin',
                },
                {
                  input: 'find fragments -type f ! -name "*.key" -delete',
                  output: '',
                },
              ],
          },
        ],
      },
      {
        id: 'topic-branches',
        title: 'Ветки Git и перенос изменений',
        command: 'git branch <name>',
        description:
          'Создание веток, перенос изменений и объединение результатов работы.',
        briefing:
          'Ветки помогают разделять работу: отдельные задачи живут в своих ветках, а итоговые изменения аккуратно вливаются.',
        goal:
          'Создать рабочие ветки, сделать изменения в нужных ветках и объединить их в правильном порядке.',
        modes: [
          {
            id: 'flow',
            title: 'Базовый поток',
            summary: 'Создание веток, коммиты, merge.',
            theory:
              'Главный принцип: работа идёт в ветках, а интеграция выполняется через merge в нужной последовательности.',
            steps: [
              {
                title: 'Создайте базовую ветку',
                theory:
                  'Основную рабочую ветку часто создают отдельно от main, чтобы не мешать стабильной версии.',
                practice: 'Выполните git checkout -b workbench.',
              },
              {
                title: 'Создайте рабочую ветку',
                theory:
                  'Новая ветка создаётся от текущей и наследует все изменения.',
                practice: 'Выполните git checkout -b task/import-keys.',
              },
              {
                title: 'Сделайте коммит с изменениями',
                theory:
                  'Коммит фиксирует состояние ветки и упрощает дальнейшее слияние.',
                practice:
                  'Выполните git add -A и git commit -m "task/import-keys: add audit step".',
              },
              {
                title: 'Создайте ветку фичи',
                theory:
                  'Фичи лучше выделять в отдельные ветки для изоляции правок.',
                practice: 'Выполните git checkout -b feature/audit-log.',
              },
              {
                title: 'Слейте фичу в рабочую ветку',
                theory:
                  'После завершения фичи её вливают в родительскую ветку.',
                practice:
                  'Выполните git checkout task/import-keys и git merge feature/audit-log.',
              },
              {
                title: 'Подготовьте релизную ветку',
                theory:
                  'Релизную ветку создают от рабочей базы после интеграции нужных изменений.',
                practice: 'Выполните git checkout workbench и git checkout -b release/2026w12.',
              },
              {
                title: 'Влейте изменения по цепочке',
                theory:
                  'Сначала обновляют workbench, затем передают изменения в release.',
                practice:
                  'Выполните git checkout workbench && git merge task/import-keys, затем git checkout release/2026w12 && git merge workbench.',
              },
            ],
            notes: [
              'Проверяйте активную ветку командой git branch.',
              'Сообщения коммитов должны отражать ветку и задачу.',
            ],
            examples: [
              {
                input: 'git branch',
                output: '* main\n  workbench\n  task/import-keys',
              },
              {
                input: 'git checkout -b feature/audit-log',
                output: "Switched to a new branch 'feature/audit-log'",
              },
              {
                input: 'git merge feature/audit-log',
                output: 'Updating 2f4a1c3..9ab2d10\nFast-forward\n logs/audit.log | 1 +',
              },
              {
                input: 'git checkout -b release/2026w12',
                output: "Switched to a new branch 'release/2026w12'",
              },
            ],
          },
        ],
      },
      {
        id: 'topic-file-log',
        title: 'Логи файлов и форматирование данных',
        command: 'stat -c%s <file>',
        description:
          'Сбор размера, даты и хэша файла с записью в журнал.',
        briefing:
          'Журнал изменений помогает отслеживать состояние файла во времени: размер, дату и контрольную сумму.',
        goal:
          'Собрать метаданные файла и записать строку в лог в заданном формате.',
        modes: [
          {
            id: 'log',
            title: 'Запись метаданных',
            summary: 'Пути, дата, размер, sha.',
            theory:
              'Типичный формат записи включает путь, размер, дату и хэш. Это удобно для контроля изменений и проверки целостности.',
            steps: [
              {
                title: 'Задайте пути в переменных',
                theory:
                  'Переменные упрощают команды и уменьшают риск опечаток в путях.',
                practice: 'Выполните FILE="reports/summary.txt" и LOG="logs/file-audit.log".',
              },
              {
                title: 'Получите размер файла',
                theory:
                  'stat -c%s возвращает размер файла в байтах.',
                practice: 'Выполните size=$(stat -c%s "$FILE").',
              },
              {
                title: 'Сформируйте дату и время',
                theory:
                  'date позволяет задать формат строки времени.',
                practice: 'Выполните datetime=$(date "+%Y-%m-%d %H:%M").',
              },
              {
                title: 'Посчитайте хэш',
                theory:
                  'sha256sum возвращает хэш и имя файла; awk выбирает только хэш.',
                practice: 'Выполните sha_sum=$(sha256sum "$FILE" | awk "{print $1}").',
              },
              {
                title: 'Запишите строку в лог',
                theory:
                  'Строку можно собрать из переменных и дописать в конец файла.',
                practice:
                  'Выполните echo "$FILE - $size - $datetime - $sha_sum - SHA256" >> "$LOG".',
              },
            ],
            notes: [
              'Всегда используйте кавычки вокруг путей.',
              'Для других алгоритмов используйте md5sum или sha1sum.',
            ],
            examples: [
              {
                input: 'FILE="reports/summary.txt"',
                output: '',
              },
              {
                input: 'size=$(stat -c%s "$FILE")',
                output: '',
              },
              {
                input: 'datetime=$(date "+%Y-%m-%d %H:%M")',
                output: '',
              },
              {
                input: 'sha_sum=$(sha256sum "$FILE" | awk "{print $1}")',
                output: '',
              },
              {
                input: 'echo "$FILE - $size - $datetime - $sha_sum - SHA256" >> "$LOG"',
                output: '',
              },
            ],
          },
        ],
      },
      {
        id: 'topic-edit-script',
        title: 'Скрипт замены текста и аудит изменений',
        command: 'bash replace.sh <file> <from> <to>',
        description:
          'Замена подстрок в файле с записью метаданных в лог.',
        briefing:
          'Скрипт помогает безопасно менять текст и фиксировать изменения в журнале для контроля.',
        goal:
          'Принять путь к файлу и строки, выполнить замену и записать запись в лог в заданном формате.',
        modes: [
          {
            id: 'script',
            title: 'Скрипт',
            summary: 'Аргументы, проверки, замена, лог.',
            theory:
              'Надёжный скрипт проверяет входные данные, корректно обрабатывает путь и пишет запись в журнал после изменения.',
            steps: [
              {
                title: 'Примите аргументы',
                theory:
                  'Удобно принимать путь, строку поиска и замену как аргументы командной строки.',
                practice: 'Запустите скрипт как: bash replace.sh reports/summary.txt TODO DONE.',
              },
              {
                title: 'Проверьте входные данные',
                theory:
                  'Если аргументов меньше трёх, покажите usage и завершите работу.',
                practice: 'Сделайте проверку: if [ $# -lt 3 ]; then echo "Usage..."; exit 1; fi.',
              },
              {
                title: 'Проверьте путь к файлу',
                theory:
                  'Нужно убедиться, что файл существует и это обычный файл, а не каталог.',
                practice: 'Сделайте проверку: [ -f "$FULL_PATH" ] || exit 1.',
              },
              {
                title: 'Выполните замену',
                theory:
                  'sed подходит для глобальной замены, но важно экранировать разделители.',
                practice: 'Выполните: sed -i "s|$SEARCH|$REPLACE|g" "$FULL_PATH".',
              },
              {
                title: 'Добавьте запись в лог',
                theory:
                  'После изменения соберите размер, дату и хэш и допишите строку в лог.',
                practice:
                  'Используйте: echo "$REL_PATH - $size - $datetime - $sha_sum - SHA256" >> "$LOG".',
              },
            ],
            notes: [
              'Проверяйте, что строка поиска не пустая.',
              'Для сложных строк используйте другой разделитель в sed, например |.',
            ],
            examples: [
              {
                input: 'bash replace.sh reports/summary.txt TODO DONE',
                output: 'Updated: reports/summary.txt',
              },
              {
                input: 'bash replace.sh reports/summary.txt "" DONE',
                output: 'Error: search string is empty',
              },
              {
                input: 'bash replace.sh reports/missing.txt old new',
                output: 'Error: file not found',
              },
            ],
          },
          {
            id: 'breakdown',
            title: 'Разбор команд',
            summary: 'Файловая система, ввод и вывод.',
            theory:
              'Каждая команда в скрипте работает либо с файловой системой, либо с вводом/выводом. Разберём по отдельности.',
            steps: [
              {
                title: 'Определение корня репозитория',
                theory:
                  'git rev-parse --show-toplevel возвращает абсолютный путь к корню репозитория. Это чтение данных из Git.',
                practice: 'Команда: REPO_ROOT=$(git rev-parse --show-toplevel).',
              },
              {
                title: 'Чтение ввода пользователя',
                theory:
                  'read читает строку из стандартного ввода (stdin) и кладёт её в переменную.',
                practice: 'Команда: read filePath.',
              },
              {
                title: 'Сбор полного пути',
                theory:
                  'Склейка строк формирует путь в файловой системе. Кавычки защищают от пробелов.',
                practice: 'Команда: FULL_PATH="$REPO_ROOT/$filePath".',
              },
              {
                title: 'Проверка файла',
                theory:
                  '[ -f "$FULL_PATH" ] проверяет, что путь указывает на обычный файл. Это чтение метаданных ФС.',
                practice: 'Команда: [ -f "$FULL_PATH" ] || exit 1.',
              },
              {
                title: 'Замена текста в файле',
                theory:
                  'sed -i редактирует файл на диске, заменяя подстроки. Это запись в файловую систему.',
                practice: 'Команда: sed -i "s|$SEARCH|$REPLACE|g" "$FULL_PATH".',
              },
              {
                title: 'Размер файла',
                theory:
                  'stat -c%s читает размер файла в байтах из метаданных.',
                practice: 'Команда: size=$(stat -c%s "$FULL_PATH").',
              },
              {
                title: 'Дата и время',
                theory:
                  'date формирует строку времени в нужном формате. Это вывод в stdout и захват в переменную.',
                practice: 'Команда: datetime=$(date "+%Y-%m-%d %H:%M").',
              },
              {
                title: 'Контрольная сумма',
                theory:
                  'sha256sum читает файл и пишет хэш + имя файла. awk берёт только хэш.',
                practice: 'Команда: sha_sum=$(sha256sum "$FULL_PATH" | awk "{print $1}").',
              },
              {
                title: 'Запись в лог',
                theory:
                  'echo формирует строку, а оператор >> дописывает её в файл лога.',
                practice:
                  'Команда: echo "$REL_PATH - $size - $datetime - $sha_sum - SHA256" >> "$LOG".',
              },
            ],
            notes: [
              'stdin — источник данных для read, stdout — то, что печатает echo.',
              'Любая команда с -i пишет изменения прямо в файл.',
            ],
            examples: [
              {
                input: 'read filePath',
                output: 'user input → variable filePath',
              },
              {
                input: 'stat -c%s reports/summary.txt',
                output: '128',
              },
              {
                input: 'sha256sum reports/summary.txt | awk "{print $1}"',
                output: 'e3b0c44298fc1c149afbf4c8996fb924...',
              },
            ],
          },
        ],
      },
      {
        id: 'topic-gitlab-manual',
        title: 'Краткий мануал GitLab в Markdown',
        command: 'cat > gitlab-guide.md',
        description:
          'Структура документа, заголовки, списки и вставка скриншотов.',
        briefing:
          'Хороший мануал — это понятные разделы, короткие шаги и наглядные скриншоты.',
        goal:
          'Собрать аккуратный Markdown-документ с разделами и изображениями.',
        modes: [
          {
            id: 'md',
            title: 'Markdown',
            summary: 'Заголовки, списки, изображения.',
            theory:
              'Markdown даёт читаемую структуру: каждый раздел начинается с заголовка, шаги оформляются списком, а скриншоты вставляются как изображения.',
            steps: [
              {
                title: 'Создайте структуру разделов',
                theory:
                  'Используйте заголовки второго уровня для тем мануала.',
                practice:
                  'Добавьте разделы: "Создание репозитория", "Ветки", "Merge Request", "Issue и комментарии".',
              },
              {
                title: 'Описывайте шаги коротко',
                theory:
                  'Короткие, конкретные пункты легче читать и воспроизводить.',
                practice: 'Оформите шаги нумерованным списком.',
              },
              {
                title: 'Добавьте скриншоты',
                theory:
                  'Вставляйте изображения сразу под разделом, где они нужны.',
                practice:
                  'Используйте формат: ![Описание](images/gitlab/project-create.png).',
              },
              {
                title: 'Используйте примеры команд',
                theory:
                  'Команды оформляются в блоках кода для удобства копирования.',
                practice: 'Добавьте блок кода с git-командами.',
              },
              {
                title: 'Проверьте читаемость',
                theory:
                  'Перед сдачей пройдитесь по документу: всё ли понятно без контекста.',
                practice: 'Откройте файл и проверьте логику шагов.',
              },
            ],
            notes: [
              'Скриншоты лучше хранить рядом с документом в папке images.',
              'Делайте подписи к изображениям осмысленными.',
            ],
            examples: [
              {
                input: '## Создание проекта\n1. Откройте раздел New project.\n2. Задайте имя.\n\n![Создание](images/gitlab/project-create.png)',
                output: '',
              },
              {
                input: '```bash\ngit switch -c docs/guide\n```\n',
                output: '',
              },
            ],
          },
        ],
      },
    ]

const events = [
  {
    id: 'git-foundations',
    uid: 'C01',
    tag: 'Курс 1',
    title: 'Git: основы и рабочий процесс',
    meta: 'Формат: курс, 45 минут',
    summary: 'Клонирование, ежедневный цикл Git и работа с ветками.',
    body: [
      'Курс собирает базовые операции Git в единый, понятный поток.',
      'Мы разбираем доступ, коммиты, историю и ветвление на практике.',
    ],
    bullets: [
      'HTTPS/SSH доступ и remote',
      'status/add/commit/log',
      'ветки и merge',
    ],
    topicIds: ['topic-clone', 'topic-workflow', 'topic-branches'],
  },
  {
    id: 'filesystem-order',
    uid: 'C02',
    tag: 'Курс 2',
    title: 'Файловая система и работа с файлами',
    meta: 'Формат: курс, 35 минут',
    summary: 'Структура каталогов, порядок в данных и поиск лишних файлов.',
    body: [
      'Фокус на практической работе с файлами, каталогами и типами данных.',
      'Темы объединены вокруг аккуратной структуры и повторяемого результата.',
    ],
    bullets: [
      'создание структуры',
      'перемещение и сортировка файлов',
      'поиск и удаление файлов',
    ],
    topicIds: ['topic-files', 'topic-keys'],
  },
  {
    id: 'process-basics',
    uid: 'C03',
    tag: 'Курс 3',
    title: 'Процессы и базовые команды администрирования',
    meta: 'Формат: курс, 20 минут',
    summary: 'Поиск процессов, остановка и проверка статуса.',
    body: [
      'Короткий курс о том, как находить процессы и корректно завершать их.',
      'Сфокусировано на безопасных командах и проверке результата.',
    ],
    bullets: [
      'поиск процессов',
      'корректное завершение',
      'проверка результата',
    ],
    topicIds: ['topic-process'],
  },
  {
    id: 'edit-automation-docs',
    uid: 'C04',
    tag: 'Курс 4',
    title: 'Редактирование, автоматизация и документация',
    meta: 'Формат: курс, 50 минут',
    summary: 'Редакторы, скрипты, аудит файлов и Markdown-мануалы.',
    body: [
      'Практика работы в терминале: правка, автоматизация и фиксация изменений.',
      'В конце — оформление документации и рабочие шаблоны.',
    ],
    bullets: [
      'nano и vim',
      'скрипты и логи',
      'Markdown-документация',
    ],
    topicIds: ['topic-editor', 'topic-file-log', 'topic-edit-script', 'topic-gitlab-manual'],
  },
]

const renderTextWithCode = (text: string) => {
  if (!text.includes('```')) {
    return renderTextBlock(text)
  }
  const parts = text.split('```')
  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          return <div key={`t-${index}`}>{renderTextBlock(part)}</div>
        }
        const lines = part.replace(/\r/g, '').split('\n')
        const maybeLang = lines[0]?.trim()
        const codeLines =
          maybeLang && ['bash', 'sh', 'shell', 'console'].includes(maybeLang)
            ? lines.slice(1)
            : lines
        const code = codeLines.join('\n').trim()
        const handleCopy = () => {
          if (!code) return
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(code).catch(() => {})
            return
          }
          const textarea = document.createElement('textarea')
          textarea.value = code
          textarea.style.position = 'fixed'
          textarea.style.opacity = '0'
          document.body.appendChild(textarea)
          textarea.focus()
          textarea.select()
          try {
            document.execCommand('copy')
          } catch {}
          document.body.removeChild(textarea)
        }
        return code ? (
          <div className="code-window" key={`c-${index}`}>
            <button
              type="button"
              className="code-copy"
              onClick={handleCopy}
              aria-label="Скопировать команду"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" role="presentation">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
            </button>
            <pre>
              <code>{code}</code>
            </pre>
          </div>
        ) : null
      })}
    </>
  )
}

const renderTextBlock = (text: string) => {
  const lines = text.replace(/\r/g, '').split('\n')
  const nodes: ReactNode[] = []
  let listItems: string[] = []

  const flushList = (keyBase: string) => {
    if (listItems.length === 0) return
    nodes.push(
      <ul key={`ul-${keyBase}-${nodes.length}`}>
        {listItems.map((item, idx) => (
          <li key={`li-${keyBase}-${idx}`}>{item}</li>
        ))}
      </ul>,
    )
    listItems = []
  }

  lines.forEach((raw, idx) => {
    const line = raw.trim()
    if (!line) {
      flushList(`b-${idx}`)
      return
    }
    if (line.startsWith('- ')) {
      listItems.push(line.slice(2).trim())
      return
    }
    flushList(`p-${idx}`)
    nodes.push(<p key={`p-${idx}`}>{line}</p>)
  })

  flushList('end')
  return <>{nodes}</>
}

const timelineDays = [
  { day: 16, label: 'Старт' },
  { day: 17, label: 'Погружение' },
  { day: 18, label: 'Практика' },
  { day: 19, label: 'Команда' },
  { day: 20, label: 'Срез' },
  { day: 21, label: 'Интенсив' },
  { day: 22, label: 'Качество' },
  { day: 23, label: 'Сборка' },
  { day: 24, label: 'Рефлексия' },
]

const parseHash = (): Route => {
  const hash = window.location.hash || '#/'
  if (hash.startsWith('#/events/')) {
    const rest = hash.replace('#/events/', '').trim()
    const [id, maybeSubview, maybeIndex, maybeMode, maybeStep, maybeStepIndex] = rest
      .split('/')
      .map((item) => item.trim())
    if (maybeSubview === 'intro') {
      return { view: 'event', id, subview: 'intro' }
    }
    if (maybeSubview === 'complete') {
      return { view: 'event', id, subview: 'complete' }
    }
    if (maybeSubview === 'topic') {
      const index = Number(maybeIndex)
      const mode = maybeMode && maybeMode !== 'step' ? maybeMode : undefined
      const stepIndex =
        maybeMode === 'step'
          ? Number(maybeStep)
          : maybeStep === 'step' && maybeStepIndex !== undefined
            ? Number(maybeStepIndex)
            : undefined
      return {
        view: 'event',
        id,
        subview: 'topic',
        topicIndex: Number.isFinite(index) ? index : 0,
        mode,
        stepIndex: Number.isFinite(stepIndex ?? NaN) ? stepIndex : undefined,
      }
    }
    return { view: 'event', id }
  }
  if (hash.startsWith('#/courses')) {
    return { view: 'home', anchor: 'courses' }
  }
  return { view: 'home' }
}

function App() {
  const [route, setRoute] = useState<Route>(() => parseHash())
  const [levelText, setLevelText] = useState('LVL 0 0%')
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [topicModes, setTopicModes] = useState<Record<string, string>>({})
  const [isExamplesOpen, setIsExamplesOpen] = useState(false)
  const [openPractice, setOpenPractice] = useState<Record<string, boolean>>({})
  const [isCompactTimeline, setIsCompactTimeline] = useState(false)
  const viewedCourses = useRef<Record<string, boolean>>({})
  const metrikaOpenedCourses = useRef<Record<string, boolean>>({})
  const metrikaFinishedCourses = useRef<Record<string, boolean>>({})
  const metrikaSiteVisitSent = useRef(false)
  const metrikaQrVisitSent = useRef(false)
  const today = new Date()
  const isTargetMonth = today.getFullYear() === 2026 && today.getMonth() === 2
  const todayDay = isTargetMonth ? today.getDate() : 0
  const filledCount = timelineDays.filter((item) => item.day <= todayDay).length
  const progress =
    timelineDays.length > 1
      ? Math.max(0, Math.min(1, (filledCount - 1) / (timelineDays.length - 1)))
      : 0

  useEffect(() => {
    if (route.view === 'home' && route.anchor) {
      const el = document.getElementById(route.anchor)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [route])

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)')
    const update = () => setIsCompactTimeline(media.matches)
    update()
    if (media.addEventListener) {
      media.addEventListener('change', update)
      return () => media.removeEventListener('change', update)
    }
    media.addListener(update)
    return () => media.removeListener(update)
  }, [])

  useEffect(() => {
    const tick = () => {
      const percent = Math.floor(Math.random() * 100)
      const level = Math.floor(Math.random() * 9)
      setLevelText(`LVL ${level} ${percent}%`)
    }
    tick()
    const id = window.setInterval(tick, 900)
    return () => window.clearInterval(id)
  }, [])

  const activeEvent = useMemo(
    () => (route.view === 'event' ? events.find((e) => e.id === route.id) : null),
    [route],
  )
  const visibleEvents = useMemo(() => events.filter((event) => event.uid === 'C02'), [])
  const activeTopics = useMemo(() => {
    if (!activeEvent) return []
    const ids = activeEvent.topicIds ?? []
    return ids
      .map((id) => topics.find((topic) => topic.id === id))
      .filter((topic): topic is (typeof topics)[number] => Boolean(topic))
  }, [activeEvent])
  const stepUrl = useMemo(() => {
    if (route.view !== 'event' || !activeEvent) return ''
    const base = `${window.location.origin}${window.location.pathname}`
    if (route.subview === 'intro') {
      return `${base}#/events/${activeEvent.id}/intro`
    }
    if (route.subview === 'topic') {
      const index = route.topicIndex ?? 0
      if (route.mode && route.mode !== 'choose') {
        const stepIndex = route.stepIndex ?? 0
        return `${base}#/events/${activeEvent.id}/topic/${index}/${route.mode}/step/${stepIndex}`
      }
      if (route.mode === 'choose') {
        return `${base}#/events/${activeEvent.id}/topic/${index}/choose`
      }
      return `${base}#/events/${activeEvent.id}/topic/${index}`
    }
    return `${base}#/events/${activeEvent.id}`
  }, [activeEvent, route.view, route.subview, route.topicIndex, route.mode, route.stepIndex])
  const qrStepUrl = useMemo(() => {
    if (!stepUrl) return ''
    const [base, hash = ''] = stepUrl.split('#')
    if (!hash) return `${base}?ref=qr`
    return `${base}?ref=qr#${hash}`
  }, [stepUrl])
  const qrImageUrl = qrStepUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        qrStepUrl,
      )}`
    : ''

  useEffect(() => {
    setIsQrOpen(false)
    setIsExamplesOpen(false)
    setOpenPractice({})
    // ratings disabled for now
  }, [route.view, route.subview, activeEvent?.id])

  useEffect(() => {
    if (!metrikaSiteVisitSent.current) {
      metrikaSiteVisitSent.current = true
      reachGoal('site_visit')
    }
  }, [])

  useEffect(() => {
    if (metrikaQrVisitSent.current) return
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (!params.has('ref') || params.get('ref') !== 'qr') return
    metrikaQrVisitSent.current = true
    reachGoal('qr_visit', { ref: 'qr', path: window.location.hash || '/' })
  }, [])

  useEffect(() => {
    if (route.view !== 'event' || !activeEvent?.uid) return
    if (viewedCourses.current[activeEvent.uid]) return
    viewedCourses.current[activeEvent.uid] = true
    incrementCourseView(activeEvent.uid).catch(() => {})
  }, [route.view, activeEvent?.uid])

  useEffect(() => {
    if (route.view !== 'event' || !activeEvent?.uid) return
    if (metrikaOpenedCourses.current[activeEvent.uid]) return
    metrikaOpenedCourses.current[activeEvent.uid] = true
    reachGoal('course_open', { courseId: activeEvent.id, uid: activeEvent.uid })
  }, [route.view, activeEvent?.id, activeEvent?.uid])

  useEffect(() => {
    if (route.view !== 'event' || route.subview !== 'complete') return
    if (!activeEvent?.uid) return
    if (metrikaFinishedCourses.current[activeEvent.uid]) return
    metrikaFinishedCourses.current[activeEvent.uid] = true
    reachGoal('course_finish', { courseId: activeEvent.id, uid: activeEvent.uid })
  }, [route.view, route.subview, activeEvent?.id, activeEvent?.uid])

  // no auto-redirect: show topic intro first

  const visibleTimelineDays = useMemo(() => {
    if (!isCompactTimeline) return timelineDays
    const currentIndex = timelineDays.findIndex((item) => item.day === todayDay)
    const safeIndex = currentIndex === -1 ? 0 : currentIndex
    const start = Math.max(0, safeIndex - 1)
    const end = Math.min(timelineDays.length, safeIndex + 2)
    return timelineDays.slice(start, end)
  }, [isCompactTimeline, todayDay])

  return (
    <div className="page">
      {route.view !== 'event' ? (
        <section className="profile">
          <div className="profile-card">
            <div className="profile-bar">
              <div className="profile-progress">
                <span>{levelText}</span>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: '0%' }}></div>
                </div>
              </div>
              <div className="profile-identity">
                <div className="avatar">
                  <img src="/logo_v1.jpg" alt="Profile" loading="lazy" />
                </div>
                <div>
                  <h2>@elenipad</h2>
                  <div className="profile-links">
                    <a
                      href="https://platform.21-school.ru/profile/elenipad"
                      target="_blank"
                      rel="noreferrer"
                      className="profile-link"
                    >
                      <img
                        src="https://platform.21-school.ru/favicon-26dcd8a7.png"
                        alt=""
                        aria-hidden="true"
                      />
                      @elenipad
                    </a>
                    <a
                      href="https://github.com/elenipad"
                      target="_blank"
                      rel="noreferrer"
                      className="profile-link"
                    >
                      <img
                        src="https://github.githubassets.com/favicons/favicon.png"
                        alt=""
                        aria-hidden="true"
                      />
                      @elenipad
                    </a>
                    <a
                      href="https://rocketchat-ufa-mar-26.21-school.ru/direct/KfhcxAjijZWn3oXM9"
                      target="_blank"
                      rel="noreferrer"
                      className="profile-link"
                    >
                      <img src="/rocket_chat.png" alt="" aria-hidden="true" />
                      @elenipad
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
      {route.view === 'event' && activeEvent ? (
        <section className="event-view">
          <nav className="topline event-topline">
            <div className="event-top-left">
              <span className="brand">elenipad</span>
              <div className="event-top-title">{activeEvent.title}</div>
            </div>
            <button
              type="button"
              className="qr-icon-button"
              onClick={() => setIsQrOpen(true)}
              aria-label="Показать QR-код шага"
            >
              <svg viewBox="0 0 24 24" role="presentation" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1.6"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1.6"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1.6"></rect>
                <rect x="14" y="14" width="3" height="3" rx="0.8"></rect>
                <rect x="18.5" y="14" width="2.5" height="6.5" rx="0.8"></rect>
                <rect x="14" y="18.5" width="3.5" height="2.5" rx="0.8"></rect>
              </svg>
            </button>
          </nav>
          {route.subview === undefined ? (
            <>
              <div className="event-card">
                {activeEvent.tag ? (
                  <span className="course-tag">{activeEvent.tag}</span>
                ) : null}
                <div className="event-title-row">
                  <h2>{activeEvent.title}</h2>
                </div>
                <p className="event-meta">{activeEvent.meta}</p>
                <p className="lead">{activeEvent.summary}</p>
                <div className="event-body">
                  {activeEvent.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <ul>
                    {activeEvent.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : null}
          {activeTopics.length > 0 && route.subview === 'intro' ? (
            <div className="topic-block">
              <div className="topic-intro" id="topics-intro">
                <h3>Введение</h3>
                <p className="topic-intro-text">
                  Перед вами темы курса. Ознакомьтесь с ними и переходите к первой теме.
                </p>
                <div className="topic-intro-list">
                  {activeTopics.map((topic, index) => (
                    <div className="topic-intro-item" key={topic.id}>
                      <span className="topic-nav-index">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <span>{topic.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          {activeTopics.length > 0 && route.subview === 'topic' ? (
            <div className="topic-block">
              {(() => {
                const idx = Math.max(
                  0,
                  Math.min(activeTopics.length - 1, route.topicIndex ?? 0),
                )
                const topic = activeTopics[idx]
                const isChoosing = route.mode === 'choose'
                const isModePage = !!route.mode && route.mode !== 'choose'
                return (
                  <article className="topic-item" id={topic.id}>
                    {!isModePage ? (
                      <div className="topic-header">
                        <div className="topic-title">
                          <span className="topic-badge">
                            {(idx + 1).toString().padStart(2, '0')}
                          </span>
                          <div>
                            <h4>{topic.title}</h4>
                            <p className="topic-description">{topic.description}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {!isModePage && !isChoosing ? (
                      <div className="topic-brief">
                        <div className="topic-brief-card">
                          <div className="topic-notes-title">Брифинг</div>
                          <p>{topic.briefing}</p>
                        </div>
                        <div className="topic-brief-card">
                          <div className="topic-notes-title">Цель</div>
                          <p>{topic.goal}</p>
                        </div>
                      </div>
                    ) : null}
                    {isChoosing ? (
                      <div className="topic-choice">
                        <div className="topic-choice-head">
                          <div>
                            <div className="topic-choice-kicker">Точка выбора</div>
                            <h5>Выберите путь клонирования</h5>
                            <p className="topic-choice-subtitle">
                              Нажмите на карточку, чтобы открыть инструкции для HTTPS или SSH.
                            </p>
                          </div>
                          <div className="topic-choice-badge">Выбор</div>
                        </div>
                        <div className="topic-choice-buttons">
                          {topic.modes.map((mode) => {
                            const selected = (topicModes[topic.id] ?? '') === mode.id
                            return (
                              <button
                                type="button"
                                className={`topic-choice-button${selected ? ' active' : ''}`}
                                data-variant={mode.id}
                                aria-pressed={selected}
                                onClick={() =>
                                  setTopicModes((prev) => ({ ...prev, [topic.id]: mode.id }))
                                }
                                key={mode.id}
                              >
                                <span className="topic-choice-title">{mode.title}</span>
                                <span className="topic-choice-summary">{mode.summary}</span>
                              </button>
                            )
                          })}
                        </div>
                        {topicModes[topic.id] ? (
                          <div className="topic-choice-theory">
                            <div className="topic-notes-title">Теория</div>
                            <p>
                              {
                                topic.modes.find((mode) => mode.id === topicModes[topic.id])
                                  ?.theory
                              }
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {isModePage ? (
                      (() => {
                        const activeMode = topic.modes.find((mode) => mode.id === route.mode)
                        return activeMode ? (
                          <div className="topic-mode topic-mode-animate">
                            {(() => {
                              const nextTopic = activeTopics[idx + 1]
                              const summaryStep = {
                                title: 'Итог темы',
                                theory: nextTopic
                                  ? `Вы прошли тему и закрепили ключевые действия.\nДалее: ${nextTopic.title}.`
                                  : 'Вы прошли тему и закрепили ключевые действия.\nЭто последняя тема курса.',
                                practice: '',
                                isSummary: true,
                              }
                              const stepsWithSummary = [
                                ...activeMode.steps,
                                summaryStep,
                              ] as (typeof activeMode.steps)[number][]
                              const totalSteps = stepsWithSummary.length
                              const stepIndex = Math.max(
                                0,
                                Math.min(totalSteps - 1, route.stepIndex ?? 0),
                              )
                              const step = stepsWithSummary[stepIndex]
                              const examples = activeMode.examples ?? []
                              const stepExample = examples[stepIndex]
                              const stepExamples = Array.isArray(stepExample)
                                ? stepExample
                                : stepExample
                                  ? [stepExample]
                                  : []
                              const hasPractice = Boolean(step.practice)
                              const stepKey = `${topic.id}-${route.mode}-${stepIndex}`
                              const isPracticeOpen = !!openPractice[stepKey]
                              return (
                                <div className="topic-steps-grid">
                                  <div className="topic-step-topicbar">
                                    <span className="topic-step-topicname">
                                      {(idx + 1).toString().padStart(2, '0')} {topic.title}
                                    </span>
                                    <span className="topic-step-topicline"></span>
                                    <span className="topic-step-count">
                                      Шаг {stepIndex + 1} из {totalSteps}
                                    </span>
                                  </div>
                                  {!step.isSummary ? (
                                    <div className="topic-step-header">
                                      <div className="topic-step-index">
                                        {(stepIndex + 1).toString().padStart(2, '0')}
                                      </div>
                                      <div className="topic-step-text">
                                        <div className="topic-step-title">
                                          {step.title}
                                        </div>
                                      </div>
                                    </div>
                                  ) : null}
                                  {step.isSummary ? (
                                    <div className="topic-summary">
                                      <div className="topic-summary-head">
                                        <div>
                                          <div className="topic-summary-kicker">Итог темы</div>
                                          <h5>{topic.title}</h5>
                                          <p>
                                            Вы завершили тему. Коротко напомним, что уже
                                            пройдено.
                                          </p>
                                        </div>
                                      </div>
                                      <ul className="topic-summary-list">
                                        <li>Ключевые команды и флаги закреплены</li>
                                        <li>Практические действия выполнены</li>
                                        <li>Можно переходить к следующей теме</li>
                                      </ul>
                                      <div className="topic-summary-next">
                                        {nextTopic ? (
                                          <>
                                            <span>Следующая тема:</span>
                                            <strong>{nextTopic.title}</strong>
                                          </>
                                        ) : (
                                          <span>Это последняя тема курса.</span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="topic-step-block">
                                      <div className="topic-step-block-title">Теория</div>
                                      {renderTextWithCode(step.theory)}
                                    </div>
                                  )}
                                  {hasPractice ? (
                                    <>
                                      <button
                                        type="button"
                                        className="btn ghost topic-expand"
                                        onClick={() =>
                                          setOpenPractice((prev) => ({
                                            ...prev,
                                            [stepKey]: !prev[stepKey],
                                          }))
                                        }
                                      >
                                        {isPracticeOpen ? 'Скрыть практику' : 'Начать практику'}
                                      </button>
                                      {isPracticeOpen ? (
                                        <>
                                          <div className="topic-step-block">
                                            <div className="topic-step-block-title">Практика</div>
                                            {renderTextWithCode(step.practice ?? '')}
                                          </div>
                                          {stepExamples.length > 0 ? (
                                            <>
                                              <button
                                                type="button"
                                                className="btn ghost topic-expand"
                                                onClick={() => setIsExamplesOpen((prev) => !prev)}
                                              >
                                                {isExamplesOpen
                                                  ? 'Скрыть примеры'
                                                  : 'Показать примеры'}
                                              </button>
                                              {isExamplesOpen ? (
                                                <div className="topic-examples">
                                                  {stepExamples.map((example, exampleIndex) => (
                                                    <div
                                                      className="topic-example"
                                                      key={`${topic.id}-${exampleIndex}`}
                                                    >
                                                      <div className="topic-example-label">
                                                        Пример {exampleIndex + 1}
                                                      </div>
                                                      <div className="topic-example-label">Ввод</div>
                                                      <pre>
                                                        <code>{example.input}</code>
                                                      </pre>
                                                      {example.output ? (
                                                        <>
                                                          <div className="topic-example-label">
                                                            Вывод
                                                          </div>
                                                          <pre>
                                                            <code>{example.output}</code>
                                                          </pre>
                                                        </>
                                                      ) : null}
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : null}
                                            </>
                                          ) : null}
                                        </>
                                      ) : null}
                                    </>
                                  ) : null}
                                </div>
                              )
                            })()}
                          </div>
                        ) : null
                      })()
                    ) : null}
                  </article>
                )
              })()}
            </div>
          ) : null}
          {route.subview === 'complete' ? (
            <section className="course-complete">
              <div className="course-complete-card">
                <div className="course-complete-kicker">Курс завершён</div>
                <h3>Отличная работа!</h3>
                <p>
                  Вы прошли все темы курса. Ниже — список пройденных тем и быстрая
                  сводка.
                </p>
              </div>
              <div className="course-complete-grid">
                <div className="course-checklist">
                  <div className="course-checklist-title">Пройденные темы</div>
                  <ul>
                    {activeTopics.map((topic) => (
                      <li key={topic.id}>
                        <span className="checkmark" aria-hidden="true">
                          ✓
                        </span>
                        <span>{topic.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ) : null}
          {activeTopics.length > 0 ? (
            <div className="nav-bottom">
              {route.subview === undefined ? (
                <>
                  <a className="btn ghost" href="#/">
                    <span className="nav-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" role="presentation">
                        <path d="M19 12H7"></path>
                        <path d="M11 6l-6 6 6 6"></path>
                      </svg>
                    </span>
                    Меню
                  </a>
                  <a className="btn primary" href={`#/events/${activeEvent.id}/intro`}>
                    <span className="nav-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" role="presentation">
                        <path d="M5 12h12"></path>
                        <path d="M13 6l6 6-6 6"></path>
                      </svg>
                    </span>
                    Далее
                  </a>
                </>
              ) : route.subview === 'intro' ? (
                <>
                  <a className="btn ghost" href={`#/events/${activeEvent.id}`}>
                    <span className="nav-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" role="presentation">
                        <path d="M19 12H7"></path>
                        <path d="M11 6l-6 6 6 6"></path>
                      </svg>
                    </span>
                    Назад
                  </a>
                  <a className="btn primary" href={`#/events/${activeEvent.id}/topic/0`}>
                    Далее
                    <span className="nav-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" role="presentation">
                        <path d="M5 12h12"></path>
                        <path d="M13 6l6 6-6 6"></path>
                      </svg>
                    </span>
                  </a>
                </>
              ) : route.subview === 'complete' ? (
                <>
                  <a className="btn ghost" href={`#/events/${activeEvent.id}/intro`}>
                    <span className="nav-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" role="presentation">
                        <path d="M19 12H7"></path>
                        <path d="M11 6l-6 6 6 6"></path>
                      </svg>
                    </span>
                    К темам
                  </a>
                  <a className="btn primary" href="#/">
                    В меню
                    <span className="nav-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" role="presentation">
                        <path d="M5 12h12"></path>
                        <path d="M13 6l6 6-6 6"></path>
                      </svg>
                    </span>
                  </a>
                </>
              ) : (
                <>
                  {(() => {
                    const idx = Math.max(
                      0,
                      Math.min(activeTopics.length - 1, route.topicIndex ?? 0),
                    )
                    const topic = activeTopics[idx]
                    const isChoosing = route.mode === 'choose'
                    const isModePage = !!route.mode && route.mode !== 'choose'
                    const showChoiceOnly = (topic.modes?.length ?? 0) > 1 && isChoosing
                    const selectedMode = topicModes[topic.id] ?? ''
                    const activeMode = isModePage
                      ? topic.modes.find((mode) => mode.id === route.mode)
                      : null
                    const totalSteps = activeMode
                      ? activeMode.steps.length + 1
                      : 0
                    const stepIndex = Math.max(0, Math.min(totalSteps - 1, route.stepIndex ?? 0))
                    return (
                      <>
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() => {
                            if (isModePage) {
                              if (stepIndex > 0) {
                                window.location.hash = `#/events/${activeEvent.id}/topic/${idx}/${route.mode}/step/${stepIndex - 1}`
                              } else {
                                if ((topic.modes?.length ?? 0) > 1) {
                                  window.location.hash = `#/events/${activeEvent.id}/topic/${idx}/choose`
                                } else {
                                  window.location.hash = `#/events/${activeEvent.id}/topic/${idx}`
                                }
                              }
                              return
                            }
                            const prevIndex = (route.topicIndex ?? 0) - 1
                            if (prevIndex >= 0) {
                              window.location.hash = `#/events/${activeEvent.id}/topic/${prevIndex}`
                            } else {
                              window.location.hash = `#/events/${activeEvent.id}/intro`
                            }
                          }}
                        >
                          <span className="nav-icon" aria-hidden="true">
                            <svg viewBox="0 0 24 24" role="presentation">
                              <path d="M19 12H7"></path>
                              <path d="M11 6l-6 6 6 6"></path>
                            </svg>
                          </span>
                          Назад
                        </button>
                        {!route.mode ? (
                          <button
                            type="button"
                            className="btn primary"
                            onClick={() => {
                              if ((topic.modes?.length ?? 0) > 1) {
                                window.location.hash = `#/events/${activeEvent.id}/topic/${idx}/choose`
                              } else {
                                const onlyMode = topic.modes?.[0]?.id
                                if (onlyMode) {
                                  window.location.hash = `#/events/${activeEvent.id}/topic/${idx}/${onlyMode}/step/0`
                                }
                              }
                            }}
                          >
                            Далее
                            <span className="nav-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" role="presentation">
                                <path d="M5 12h12"></path>
                                <path d="M13 6l6 6-6 6"></path>
                              </svg>
                            </span>
                          </button>
                        ) : null}
                        {showChoiceOnly && selectedMode ? (
                          <button
                            type="button"
                            className="btn primary"
                            onClick={() => {
                              if (!selectedMode) return
                              window.location.hash = `#/events/${activeEvent.id}/topic/${idx}/${selectedMode}/step/0`
                            }}
                          >
                            Далее
                            <span className="nav-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" role="presentation">
                                <path d="M5 12h12"></path>
                                <path d="M13 6l6 6-6 6"></path>
                              </svg>
                            </span>
                          </button>
                        ) : null}
                        {isModePage ? (
                          <button
                            type="button"
                            className="btn primary"
                            onClick={() => {
                              if (totalSteps && stepIndex + 1 < totalSteps) {
                                window.location.hash = `#/events/${activeEvent.id}/topic/${idx}/${route.mode}/step/${stepIndex + 1}`
                                return
                              }
                              const nextTopic = idx + 1
                              if (nextTopic < activeTopics.length) {
                                window.location.hash = `#/events/${activeEvent.id}/topic/${nextTopic}`
                              } else {
                                window.location.hash = `#/events/${activeEvent.id}/complete`
                              }
                            }}
                          >
                            Далее
                            <span className="nav-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" role="presentation">
                                <path d="M5 12h12"></path>
                                <path d="M13 6l6 6-6 6"></path>
                              </svg>
                            </span>
                          </button>
                        ) : null}
                      </>
                    )
                  })()}
                </>
              )}
            </div>
          ) : null}
          {isQrOpen && (
            <div
              className="qr-modal-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="QR-код курса"
              onClick={() => setIsQrOpen(false)}
            >
              <div className="qr-modal" onClick={(event) => event.stopPropagation()}>
                <div className="qr-modal-header">
                  <div>
                    <div className="qr-modal-eyebrow">QR-код</div>
                    <h3>{activeEvent.title}</h3>
                  </div>
                  <button
                    type="button"
                    className="btn ghost qr-close"
                    onClick={() => setIsQrOpen(false)}
                  >
                    Закрыть
                  </button>
                </div>
                <div className="qr-code">
                  {qrImageUrl ? (
                    <img src={qrImageUrl} alt="QR-код курса" />
                  ) : null}
                </div>
                <p className="qr-url">{qrStepUrl || stepUrl}</p>
              </div>
            </div>
          )}
          {null}
        </section>
      ) : (
        <>
          <header className="hero">
            <div className="hero-simple">
              <div className="hero-main">
                <div className="hero-badge">21-я школа</div>
                <p className="eyebrow">Влог участника</p>
                <h3>Участник 21-ой школы, elenipad</h3>
                <p className="lead">23 года · программист · в разработке с 2022</p>
                <div className="hero-meta">
                  <span>Старт: 16.03.2026</span>
                  <span>Длительность: 2 недели</span>
                  <span>Курсов: 4</span>
                </div>
              </div>
              <div className="hero-projects">
                <div className="projects-title">Проекты</div>
                <div className="projects-grid">
                  <a
                    className="project-card"
                    href="https://forum.faforever.com/topic/4724/ethereal-faf-client-2-0"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Ethereal FAF Client"
                  >
                    <span className="project-logo logo-ethereal">
                      <img
                        src="/faf_ethereal_client.png"
                        alt="Ethereal FAF Client"
                        loading="lazy"
                      />
                    </span>
                    <div>
                      <h4>FAF Client</h4>
                      <p>WPF client</p>
                    </div>
                  </a>
                  <a
                    className="project-card"
                    href="https://moonlumevpn.ru"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="MoonlumeVPN"
                    onClick={() => reachGoal('project_click', { project: 'moonlumevpn' })}
                  >
                    <span className="project-logo logo-moonlume">
                      <img
                        src="/moonlumevpn.png"
                        alt="MoonlumeVPN"
                        loading="lazy"
                      />
                    </span>
                    <div>
                      <h4 className="project-title-nowrap">
                        MoonlumeVPN
                        <span className="project-desc-inline">
                          Интернет приватность
                        </span>
                      </h4>
                    </div>
                  </a>
                  <a
                    className="project-card"
                    href="https://yurtarb.ru"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Yurta"
                  >
                    <span className="project-logo logo-paygate">
                      <img
                        className="logo-img logo-yurta"
                        src="/yurta.svg"
                        alt="Yurta"
                        loading="lazy"
                      />
                    </span>
                    <div>
                      <h4>Юрта ЛК</h4>
                      <p>Платежный шлюз</p>
                    </div>
                  </a>
                  <a
                    className="project-card"
                    href="https://alga-card.ru"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="https://alga-card.ru"
                  >
                    <span className="project-logo logo-rb">
                      <img src="/kzrb.ico" alt="Карта жителя РБ" loading="lazy" />
                    </span>
                    <div>
                      <h4>Карта жителя РБ</h4>
                      <p>Цифровой профиль</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </header>

          <section className="section timeline">
            <div className="timeline-bar">
              <div
                className="timeline-line"
                style={{ ['--progress' as string]: progress }}
                aria-hidden="true"
              ></div>
              <div className="timeline-points">
                {visibleTimelineDays.map((item) => {
                  const isActive = item.day <= todayDay
                  const isCurrent = item.day === todayDay
                  return (
                    <button
                      className={`timeline-point${isActive ? ' active' : ' future'}${
                        isCurrent ? ' current' : ''
                      }`}
                      key={item.day}
                    >
                      <span className="timeline-date">
                        {item.day.toString().padStart(2, '0')}.03
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section id="courses" className="section">
            <div className="section-head">
              <h2>Курсы</h2>
              <p>Каждый курс открывается как полноценный блог.</p>
            </div>
            <div className="course-grid">
              {visibleEvents.map((event) => (
                <article className="course-card" key={event.id}>
                  <a className="course-link" href={`#/events/${event.id}`}>
                    {event.tag ? <span className="course-tag">{event.tag}</span> : null}
                    <h3>{event.title}</h3>
                    <p>{event.summary}</p>
                    <span className="course-meta">{event.meta}</span>
                  </a>
                </article>
              ))}
            </div>
          </section>

          <footer className="footer">
            <div>
              <h2>Финальная цель</h2>
              <p>
                Сформировать сильную историю участия в 21-ой школе и оставить
                концентрированный архив двух недель.
              </p>
            </div>
            <div className="footer-actions">
              <a className="btn primary" href="#courses">
                Вернуться к курсам
              </a>
              <p className="footer-note">elenipad · сезон 2026</p>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}

export default App
