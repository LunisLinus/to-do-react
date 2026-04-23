import { useEffect, useMemo, useRef, useState } from "react";

const storageKey = "tasks";

const defaultTaskTexts = [
  "Сделать проектную работу",
  "Полить цветы",
  "Пройти туториал по Реакту",
  "Сделать фронт для своего проекта",
  "Прогуляться по улице в солнечный день",
  "Помыть посуду"
];

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeStoredTasks(raw) {
  if (!Array.isArray(raw)) return null;

  const normalized = raw
    .map((item) => {
      if (typeof item === "string") return { id: createId(), text: item };
      if (item && typeof item === "object" && typeof item.text === "string") {
        return { id: typeof item.id === "string" ? item.id : createId(), text: item.text };
      }
      return null;
    })
    .filter(Boolean);

  return normalized.length ? normalized : [];
}

function loadInitialTasks() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return defaultTaskTexts.map((text) => ({ id: createId(), text }));

  try {
    const parsed = JSON.parse(raw);
    const tasks = normalizeStoredTasks(parsed);
    if (tasks) return tasks;
  } catch {}

  return defaultTaskTexts.map((text) => ({ id: createId(), text }));
}

function TodoItem({
  task,
  isEditing,
  editingText,
  onDelete,
  onDuplicate,
  onStartEdit,
  onChangeEditText,
  onCommitEdit
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  return (
    <li className="to-do__item">
      {isEditing ? (
        <input
          ref={inputRef}
          className="to-do__item-text"
          value={editingText}
          onChange={(e) => onChangeEditText(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommitEdit();
            }
          }}
        />
      ) : (
        <span className="to-do__item-text" onClick={onStartEdit}>
          {task.text}
        </span>
      )}

      <button
        type="button"
        className="to-do__item-button to-do__item-button_type_edit"
        aria-label="Редактировать"
        onClick={onStartEdit}
      />
      <button
        type="button"
        className="to-do__item-button to-do__item-button_type_duplicate"
        aria-label="Копировать"
        onClick={onDuplicate}
      />
      <button
        type="button"
        className="to-do__item-button to-do__item-button_type_delete"
        aria-label="Удалить"
        onClick={onDelete}
      />
    </li>
  );
}

export default function App() {
  const [tasks, setTasks] = useState(() => loadInitialTasks());
  const [newTaskText, setNewTaskText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const editingTask = useMemo(
    () => (editingId ? tasks.find((t) => t.id === editingId) : null),
    [editingId, tasks]
  );

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (!editingId) return;
    if (!editingTask) {
      setEditingId(null);
      setEditingText("");
      return;
    }
    setEditingText(editingTask.text);
  }, [editingId, editingTask]);

  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTasks((prev) => [{ id: createId(), text: trimmed }, ...prev]);
  }

  function commitEdit() {
    const trimmed = editingText.trim();
    if (!editingId) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === editingId ? { ...t, text: trimmed || t.text } : t))
    );
    setEditingId(null);
    setEditingText("");
  }

  return (
    <>
      <main className="main">
        <section className="to-do">
          <h1 className="to-do__title">Список дел</h1>
          <form
            className="to-do__form"
            onSubmit={(e) => {
              e.preventDefault();
              addTask(newTaskText);
              setNewTaskText("");
            }}
          >
            <input
              className="to-do__input"
              name="task"
              placeholder="Следующее дело..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
            />
            <button className="to-do__submit" type="submit">
              Добавить
            </button>
          </form>

          <ul className="to-do__list">
            {tasks.map((task) => (
              <TodoItem
                key={task.id}
                task={task}
                isEditing={editingId === task.id}
                editingText={editingId === task.id ? editingText : ""}
                onDelete={() => setTasks((prev) => prev.filter((t) => t.id !== task.id))}
                onDuplicate={() =>
                  setTasks((prev) => [{ id: createId(), text: task.text }, ...prev])
                }
                onStartEdit={() => setEditingId(task.id)}
                onChangeEditText={setEditingText}
                onCommitEdit={commitEdit}
              />
            ))}
          </ul>
        </section>
      </main>

      <footer className="footer">© Yandex.Praktikum 2025</footer>
    </>
  );
}
