import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './App.css'
import { events, topics } from './data/courses'
import { incrementCourseView } from './services/courseStats'
import hljs from 'highlight.js/lib/core'
import c from 'highlight.js/lib/languages/c'
import 'highlight.js/styles/github.css'

hljs.registerLanguage('c', c)

type Route =
  | {
      view: 'home'
    }
  | {
      view: 'course'
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
        const lang = maybeLang || ''
        const codeLines =
          lang && ['bash', 'sh', 'shell', 'console', 'c', 'cpp'].includes(lang)
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
              <code className={lang ? `language-${lang}` : undefined}>{code}</code>
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

const courseSlug = (id: string) => `course-${id}`

const parseCourseRoute = (id: string, rest: string[]): Route => {
  const [maybeSubview, maybeIndex, maybeMode, maybeStep, maybeStepIndex] = rest
  if (maybeSubview === 'intro') {
    return { view: 'course', id, subview: 'intro' }
  }
  if (maybeSubview === 'complete') {
    return { view: 'course', id, subview: 'complete' }
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
      view: 'course',
      id,
      subview: 'topic',
      topicIndex: Number.isFinite(index) ? index : 0,
      mode,
      stepIndex: Number.isFinite(stepIndex ?? NaN) ? stepIndex : undefined,
    }
  }
  return { view: 'course', id }
}

const parseHash = (): Route => {
  const hash = window.location.hash || '#/'
  if (hash.startsWith('#/home')) {
    return { view: 'home' }
  }
  if (hash.startsWith('#/courses')) {
    const rest = hash.replace('#/courses', '').replace(/^\/+/, '').trim()
    if (!rest) return { view: 'home' }
    const parts = rest.split('/').map((item) => item.trim()).filter(Boolean)
    const [coursePart, ...tail] = parts
    if (!coursePart || !coursePart.startsWith('course-')) {
      return { view: 'home' }
    }
    const id = coursePart.replace('course-', '')
    if (!id) return { view: 'home' }
    return parseCourseRoute(id, tail)
  }
  if (hash.startsWith('#/course-')) {
    const rest = hash.replace('#/', '').trim()
    const parts = rest.split('/').map((item) => item.trim()).filter(Boolean)
    const [coursePart, ...tail] = parts
    if (!coursePart || !coursePart.startsWith('course-')) {
      return { view: 'home' }
    }
    const id = coursePart.replace('course-', '')
    if (!id) return { view: 'home' }
    return parseCourseRoute(id, tail)
  }
  if (hash.startsWith('#/events/')) {
    const rest = hash.replace('#/events/', '').trim()
    const parts = rest.split('/').map((item) => item.trim()).filter(Boolean)
    const [id, ...tail] = parts
    return parseCourseRoute(id, tail)
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
  const viewedCourses = useRef<Record<string, boolean>>({})
  const metrikaOpenedCourses = useRef<Record<string, boolean>>({})
  const metrikaFinishedCourses = useRef<Record<string, boolean>>({})
  const metrikaSiteVisitSent = useRef(false)
  const metrikaQrVisitSent = useRef(false)

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const blocks = document.querySelectorAll('pre code')
    blocks.forEach((block) => {
      hljs.highlightElement(block as HTMLElement)
    })
  }, [route, isExamplesOpen, openPractice, topicModes])

  const activeEvent = useMemo(
    () => (route.view === 'course' ? events.find((e) => e.id === route.id) : null),
    [route],
  )
  const activeCourseHash = activeEvent ? `#/${courseSlug(activeEvent.id)}` : ''
  const isCourseView = route.view === 'course' && Boolean(activeEvent)
  const resolvedView = !activeEvent && route.view === 'course' ? 'home' : route.view
  const visibleEvents = useMemo(() => {
    const allowed = new Set(['C02', 'C05', 'C06'])
    return events
      .filter((event) => allowed.has(event.uid))
      .slice()
      .sort((a, b) => {
        const aNum = Number(a.uid.replace(/[^\d]/g, '')) || 0
        const bNum = Number(b.uid.replace(/[^\d]/g, '')) || 0
        if (aNum !== bNum) return aNum - bNum
        return a.uid.localeCompare(b.uid)
      })
  }, [])
  const activeTopics = useMemo(() => {
    if (!activeEvent) return []
    const ids = activeEvent.topicIds ?? []
    return ids
      .map((id) => topics.find((topic) => topic.id === id))
      .filter((topic): topic is (typeof topics)[number] => Boolean(topic))
  }, [activeEvent])
  const stepUrl = useMemo(() => {
    if (route.view !== 'course' || !activeEvent) return ''
    const base = `${window.location.origin}${window.location.pathname}`
    const courseBase = `#/${courseSlug(activeEvent.id)}`
    if (route.subview === 'intro') {
      return `${base}${courseBase}/intro`
    }
    if (route.subview === 'topic') {
      const index = route.topicIndex ?? 0
      if (route.mode && route.mode !== 'choose') {
        const stepIndex = route.stepIndex ?? 0
        return `${base}${courseBase}/topic/${index}/${route.mode}/step/${stepIndex}`
      }
      if (route.mode === 'choose') {
        return `${base}${courseBase}/topic/${index}/choose`
      }
      return `${base}${courseBase}/topic/${index}`
    }
    return `${base}${courseBase}`
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
    if (route.view !== 'course' || !activeEvent?.uid) return
    if (viewedCourses.current[activeEvent.uid]) return
    viewedCourses.current[activeEvent.uid] = true
    incrementCourseView(activeEvent.uid).catch(() => {})
  }, [route.view, activeEvent?.uid])

  useEffect(() => {
    if (route.view !== 'course' || !activeEvent?.uid) return
    if (metrikaOpenedCourses.current[activeEvent.uid]) return
    metrikaOpenedCourses.current[activeEvent.uid] = true
    reachGoal('course_open', { courseId: activeEvent.id, uid: activeEvent.uid })
  }, [route.view, activeEvent?.id, activeEvent?.uid])

  useEffect(() => {
    if (route.view !== 'course' || route.subview !== 'complete') return
    if (!activeEvent?.uid) return
    if (metrikaFinishedCourses.current[activeEvent.uid]) return
    metrikaFinishedCourses.current[activeEvent.uid] = true
    reachGoal('course_finish', { courseId: activeEvent.id, uid: activeEvent.uid })
  }, [route.view, route.subview, activeEvent?.id, activeEvent?.uid])

  // no auto-redirect: show topic intro first

  return (
    <div className="page">
      {!isCourseView ? (
        <section className="profile">
          <div className="profile-card">
            <div className="profile-bar">
              <div className="profile-identity">
                <div className="avatar">
                  <img src="/logo_v1.jpg" alt="Profile" loading="lazy" />
                </div>
                <div className="profile-identity-text">
                  <h2>@elenipad</h2>
                  <div className="profile-progress">
                    <span>{levelText}</span>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                21-platform
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
                github
              </a>
              <a
                href="https://rocketchat-ufa-mar-26.21-school.ru/direct/KfhcxAjijZWn3oXM9"
                target="_blank"
                rel="noreferrer"
                className="profile-link"
              >
                <img src="/rocket_chat.png" alt="" aria-hidden="true" />
                rocket
              </a>
            </div>
          </div>
        </section>
      ) : null}
      {isCourseView ? (
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
              <div className="course-complete-card course-complete-ad-card">
                <div className="course-complete-ad-main">
                  <div className="course-complete-kicker">Поддержка</div>
                  <h3>Поддержи проект</h3>
                  <p>
                    Поддержи проект, подключи сервис для обеспечения приватности в
                    интернете.
                  </p>
                  <a
                    className="course-complete-ad-left"
                    href="https://moonlumevpn.ru"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="MoonlumeVPN"
                  >
                    <img src="/moonlumevpn.png" alt="MoonlumeVPN" loading="lazy" />
                    <span>MoonlumeVPN</span>
                  </a>
                  <a
                    className="course-complete-ad-link"
                    href="https://moonlumevpn.ru"
                    target="_blank"
                    rel="noreferrer"
                  >
                    https://moonlumevpn.ru
                  </a>
                </div>
                <div className="course-complete-ad-side">
                  <img
                    className="course-complete-ad-qr"
                    src="https://api.qrserver.com/v1/create-qr-code/?size=144x144&data=https%3A%2F%2Fmoonlumevpn.ru"
                    alt="QR Moonlumevpn.ru"
                    loading="lazy"
                  />
                  <div className="course-complete-ad-qr-label">Сканируй QR</div>
                </div>
              </div>
            </section>
          ) : null}
          {activeTopics.length > 0 ? (
            <div className="nav-bottom">
              {route.subview === undefined ? (
                <>
                  <a className="btn ghost" href="#/home">
                    <span className="nav-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" role="presentation">
                        <path d="M19 12H7"></path>
                        <path d="M11 6l-6 6 6 6"></path>
                      </svg>
                    </span>
                    Меню
                  </a>
                  <a className="btn primary" href={`${activeCourseHash}/intro`}>
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
                  <a className="btn ghost" href={activeCourseHash}>
                    <span className="nav-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" role="presentation">
                        <path d="M19 12H7"></path>
                        <path d="M11 6l-6 6 6 6"></path>
                      </svg>
                    </span>
                    Назад
                  </a>
                  <a className="btn primary" href={`${activeCourseHash}/topic/0`}>
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
                  <a className="btn ghost" href={`${activeCourseHash}/intro`}>
                    <span className="nav-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" role="presentation">
                        <path d="M19 12H7"></path>
                        <path d="M11 6l-6 6 6 6"></path>
                      </svg>
                    </span>
                    К темам
                  </a>
                  <a className="btn primary" href="#/home">
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
                                window.location.hash = `${activeCourseHash}/topic/${idx}/${route.mode}/step/${stepIndex - 1}`
                              } else {
                                if ((topic.modes?.length ?? 0) > 1) {
                                  window.location.hash = `${activeCourseHash}/topic/${idx}/choose`
                                } else {
                                  window.location.hash = `${activeCourseHash}/topic/${idx}`
                                }
                              }
                              return
                            }
                            const prevIndex = (route.topicIndex ?? 0) - 1
                            if (prevIndex >= 0) {
                              window.location.hash = `${activeCourseHash}/topic/${prevIndex}`
                            } else {
                              window.location.hash = `${activeCourseHash}/intro`
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
                                window.location.hash = `${activeCourseHash}/topic/${idx}/choose`
                              } else {
                                const onlyMode = topic.modes?.[0]?.id
                                if (onlyMode) {
                                  window.location.hash = `${activeCourseHash}/topic/${idx}/${onlyMode}/step/0`
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
                              window.location.hash = `${activeCourseHash}/topic/${idx}/${selectedMode}/step/0`
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
                                window.location.hash = `${activeCourseHash}/topic/${idx}/${route.mode}/step/${stepIndex + 1}`
                                return
                              }
                              const nextTopic = idx + 1
                              if (nextTopic < activeTopics.length) {
                                window.location.hash = `${activeCourseHash}/topic/${nextTopic}`
                              } else {
                                window.location.hash = `${activeCourseHash}/complete`
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
          {resolvedView === 'home' ? (
            <header className="hero">
              <div className="hero-simple">
                <div className="hero-main">
                  <div className="hero-kicker">
                    <span className="hero-badge">21-я школа</span>
                    <span className="eyebrow">Влог участника</span>
                  </div>
                  <h3>Участник 21-ой школы, elenipad</h3>
                  <p className="lead">23 года · программист · в разработке с 2022</p>
                </div>
              </div>
            </header>
          ) : null}

          {resolvedView === 'home' ? (
            <section id="courses" className="section">
              <div className="section-head">
                <h2>Курсы</h2>
                <p>Каждый курс открывается как полноценный блог.</p>
              </div>
              <div className="course-grid">
                {visibleEvents.map((event) => (
                  <article className="course-card" key={event.id}>
                    <a className="course-link" href={`#/${courseSlug(event.id)}`}>
                      {event.tag ? <span className="course-tag">{event.tag}</span> : null}
                      <h3>{event.title}</h3>
                      <p>{event.summary}</p>
                      <span className="course-meta">{event.meta}</span>
                    </a>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <footer className="footer">
            <div>
              <h2>Финальная цель</h2>
              <p>
                Сформировать сильную историю участия в 21-ой школе и оставить
                концентрированный архив двух недель.
              </p>
            </div>
            <div className="footer-actions">
              <a className="btn primary" href="#/home">
                На главную
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









