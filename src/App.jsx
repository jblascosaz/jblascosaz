import { useEffect, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'tareas'

const FILTERS = {
  todas: () => true,
  pendientes: (task) => !task.done,
  hechas: (task) => task.done,
}

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

function App() {
  const [tasks, setTasks] = useState(loadTasks)
  const [text, setText] = useState('')
  const [filter, setFilter] = useState('todas')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch {
      // Sin almacenamiento disponible: la lista vive solo en memoria
    }
  }, [tasks])

  function addTask(event) {
    event.preventDefault()
    const title = text.trim()
    if (!title) return
    setTasks([...tasks, { id: crypto.randomUUID(), title, done: false }])
    setText('')
  }

  function toggleTask(id) {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  function removeTask(id) {
    setTasks(tasks.filter((t) => t.id !== id))
  }

  const visible = tasks.filter(FILTERS[filter])
  const pending = tasks.filter((t) => !t.done).length

  return (
    <main className="app">
      <h1>Mis tareas</h1>
      <p className="subtitle">Se guardan en tu navegador.</p>

      <form className="new-task" onSubmit={addTask}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="¿Qué tienes que hacer?"
          aria-label="Nueva tarea"
        />
        <button type="submit" disabled={!text.trim()}>
          Añadir
        </button>
      </form>

      <div className="filters">
        {Object.keys(FILTERS).map((name) => (
          <button
            key={name}
            type="button"
            className={filter === name ? 'active' : ''}
            onClick={() => setFilter(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <ul className="tasks">
        {visible.length === 0 && <li className="empty">No hay tareas aquí.</li>}
        {visible.map((task) => (
          <li key={task.id} className={task.done ? 'done' : ''}>
            <label>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
              />
              <span>{task.title}</span>
            </label>
            <button
              type="button"
              className="remove"
              onClick={() => removeTask(task.id)}
              aria-label={`Borrar ${task.title}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="footer">
        <span>
          {pending} {pending === 1 ? 'pendiente' : 'pendientes'}
        </span>
        {tasks.some((t) => t.done) && (
          <button
            type="button"
            onClick={() => setTasks(tasks.filter((t) => !t.done))}
          >
            Borrar hechas
          </button>
        )}
      </div>
    </main>
  )
}

export default App
