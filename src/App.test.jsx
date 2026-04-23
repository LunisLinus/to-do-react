import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/react";
import App from "./App.jsx";

const defaultTasks = [
  "Сделать проектную работу",
  "Полить цветы",
  "Пройти туториал по Реакту",
  "Сделать фронт для своего проекта",
  "Прогуляться по улице в солнечный день",
  "Помыть посуду"
];

function getStoredTexts() {
  const raw = localStorage.getItem("tasks");
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return null;
  return parsed.map((t) => (typeof t === "string" ? t : t.text));
}

beforeEach(() => {
  localStorage.clear();
});

test("показывает задачи по умолчанию, если localStorage пуст", () => {
  render(<App />);

  const items = screen.getAllByRole("listitem");
  expect(items).toHaveLength(defaultTasks.length);
  expect(items.map((li) => li.textContent)).toEqual(
    expect.arrayContaining(defaultTasks)
  );
});

test("загружает задачи из localStorage при старте", () => {
  localStorage.setItem(
    "tasks",
    JSON.stringify([{ id: "1", text: "Из localStorage" }])
  );

  render(<App />);

  expect(screen.getByText("Из localStorage")).toBeInTheDocument();
  expect(screen.queryByText(defaultTasks[0])).not.toBeInTheDocument();
});

test("добавляет новую задачу в начало списка и очищает инпут", async () => {
  const user = userEvent.setup();
  render(<App />);

  const input = screen.getByPlaceholderText("Следующее дело...");
  await user.type(input, "Новая задача");
  await user.click(screen.getByRole("button", { name: "Добавить" }));

  const items = screen.getAllByRole("listitem");
  expect(items[0]).toHaveTextContent("Новая задача");
  expect(input).toHaveValue("");
});

test("не добавляет пустую задачу", async () => {
  const user = userEvent.setup();
  render(<App />);

  const itemsBefore = screen.getAllByRole("listitem").length;
  const input = screen.getByPlaceholderText("Следующее дело...");
  await user.type(input, "   ");
  await user.click(screen.getByRole("button", { name: "Добавить" }));

  const itemsAfter = screen.getAllByRole("listitem").length;
  expect(itemsAfter).toBe(itemsBefore);
});

test("удаляет задачу по кнопке", async () => {
  const user = userEvent.setup();
  render(<App />);

  const itemToDelete = screen.getByText(defaultTasks[0]).closest("li");
  await user.click(within(itemToDelete).getByLabelText("Удалить"));

  expect(screen.queryByText(defaultTasks[0])).not.toBeInTheDocument();
});

test("копирует задачу в начало списка", async () => {
  const user = userEvent.setup();
  render(<App />);

  const itemToCopy = screen.getByText(defaultTasks[1]).closest("li");
  await user.click(within(itemToCopy).getByLabelText("Копировать"));

  const items = screen.getAllByRole("listitem");
  expect(items[0]).toHaveTextContent(defaultTasks[1]);
});

test("редактирует текст задачи и сохраняет изменения", async () => {
  const user = userEvent.setup();
  render(<App />);

  const itemToEdit = screen.getByText(defaultTasks[2]).closest("li");
  await user.click(within(itemToEdit).getByLabelText("Редактировать"));

  const editInput = within(itemToEdit).getByRole("textbox");
  await user.clear(editInput);
  await user.type(editInput, "Обновленная задача");
  fireEvent.blur(editInput);

  expect(screen.getByText("Обновленная задача")).toBeInTheDocument();

  await waitFor(() => {
    const stored = getStoredTexts();
    expect(stored).toContain("Обновленная задача");
  });
});

test("начинает редактирование по клику на текст задачи", async () => {
  const user = userEvent.setup();
  render(<App />);

  const text = screen.getByText(defaultTasks[3]);
  const item = text.closest("li");
  await user.click(text);

  expect(within(item).getByRole("textbox")).toBeInTheDocument();
});
