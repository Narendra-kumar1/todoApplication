const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { format } = require("date-fns");
const { isValid } = require("date-fns");
app.use(express.json());
let db = null;
const dbpath = path.join(__dirname, "todoApplication.db");
const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
const priorityArray = ["HIGH", "MEDIUM", "LOW"];
const categoryArray = ["WORK", "HOME", "LEARNING"];

const iniatializeAndRun = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log(e.message);
  }
};
iniatializeAndRun();
const update = (obj) => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
    category: obj.category,
    dueDate: obj.due_date,
  };
};
const validTest = (obj) => {
  const { status, priority, category, todo, date1 } = obj;

  if (status !== undefined) {
    if (!statusArray.includes(status)) {
      return "status";
    }
  }
  if (priority !== undefined) {
    if (!priorityArray.includes(priority)) {
      return "priority";
    }
  }
  if (category !== undefined) {
    if (!categoryArray.includes(category)) {
      return "category";
    }
  }
  if (date1 !== undefined) {
    //console.log(date1);

    if (!isValid(new Date(date1))) {
      return "due_date";
    }
  }
};
app.get("/todos/", async (request, response) => {
  const { status, priority, category, search_q } = request.query;
  var check = validTest(request.query);
  if (check !== undefined) {
    response.status(400);
    response.send(`Invalid Todo ${check}`);
  }

  let query1;
  switch (true) {
    case priority !== undefined && status !== undefined:
      query1 = `select * from todo where status='${status}' and priority='${priority}'`;
      break;
    case category !== undefined && status !== undefined:
      query1 = `select * from todo where category='${category}' and status='${status}'`;
      break;
    case category !== undefined && priority !== undefined:
      query1 = `select * from todo where category='${category}' and priority='${priority}'`;
      break;
    case status !== undefined:
      query1 = `select * from todo where status ='${status}'`;
      break;
    case priority !== undefined:
      query1 = `select * from todo where priority='${priority}'`;
      break;
    case category !== undefined:
      query1 = `select * from todo where category ='${category}'`;
      break;
    case search_q !== undefined:
      query1 = `select * from todo where todo like '%${search_q}%'`;
  }
  const result1 = await db.all(query1);
  response.send(result1.map((obj) => update(obj)));
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query2 = `select * from todo where id=${todoId}`;
  const result2 = await db.get(query2);
  response.send(update(result2));
});

app.get("/agenda/", async (request, response) => {
  const { due_date } = request.query;

  const date1 = format(new Date(due_date), "yyyy-MM-dd");

  var t = validTest({ date1 });

  const query3 = `select * from todo where due_date='${date1}'`;
  const result4 = await db.get(query3);

  response.send(update(result4));
});

app.post("/todos/", (request, response) => {
  check = validTest(request.body);
  if (check !== undefined) {
    response.status(400);
    response.send(`Invalid Todo ${check}`);
  }
  const { id, todo, priority, status, category, dueDate } = request.body;
  const query4 = `insert into todo values(${id},'${todo}','${priority}','${status}','${category}','${dueDate}')`;
  db.run(query4);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let query5;
  const { todo, priority, status, category, dueDate } = request.body;
  switch (true) {
    case status !== undefined:
      query5 = `update todo set status='${status}'  where id=${todoId}`;
      response.send("Status Updated");
      break;
    case priority !== undefined:
      query5 = `update todo set priority='${priority}'  where id=${todoId}`;
      response.send("Priority Updated");
      break;
    case todo !== undefined:
      query5 = `update todo set todo='${todo} where id=${todoId}'`;
      response.send("Todo Updated");
      break;
    case category !== undefined:
      query5 = `update todo set  category='${category}' where id=${todoId}`;
      response.send("Category Updated");
      break;
    case dueDate !== undefined:
      query5 = `update todo set due_date='${dueDate}'  where id=${todoId}`;
      response.send("Due Date Updated");
  }
  db.run(query5);
});

app.delete("/todos/:todoId", (request, response) => {
  const { todoId } = request.params;
  const query6 = `delete from todo where id=${todoId}`;
  db.run(query6);
  response.send("Todo Deleted");
});

module.exports = app;
