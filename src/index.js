const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found" });
  }

  request.user = user;

  return next();
}

function checksDeadLine(request, response, next) {
  const { deadline } = request.body;

  if (new Date(deadline) < new Date()) {
    return response
      .status(400)
      .json({ error: "Deadline must be greater than today" });
  }

  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some((user) => user.username === username);

  if (userAlreadyExists) {
    return response.status(400).json({ error: "User already exists!" });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.json(user.todos);
});

app.post(
  "/todos",
  checksExistsUserAccount,
  checksDeadLine,
  (request, response) => {
    const { title, deadline } = request.body;
    const { user } = request;

    const todo = {
      id: uuidv4(),
      title: title,
      done: false,
      deadline: new Date(deadline),
      created_at: new Date(),
    };

    user.todos.push(todo);

    return response.status(201).json(todo);
  }
);

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksDeadLine,
  (request, response) => {
    const { user } = request;
    const { title, deadline } = request.body;
    const { id } = request.params;

    const todos = user.todos.find((todo) => todo.id === id);

    if (!todos) {
      return response.status(404).json({ error: "Todo not exists" });
    }

    todos.deadline = new Date(deadline);
    todos.title = title;
    return response
      .status(200)
      .json({ message: "Update Successfully", todo: todos });
  }
);

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todos = user.todos.find((todo) => todo.id === id);

  if (!todos) {
    return response.status(404).json({ error: "Todo not exists" });
  }

  todos.done = true;
  return response
    .status(200)
    .json({ message: "Update Successfully", todo: todos });
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { id } = request.params;

  const todoIndex = user.todos.findIndex((todo) => todo.id === id);

  if (todoIndex === -1) {
    return response.status(404).json({ error: "Todo not found" });
  }

  user.todos.splice(todoIndex, 1);
  return response.status(204).json({ message: `User ${user.name} deleted!` });
});

module.exports = app;
