var socket, wsem;

// Web socket connect
socket = io.connect(window.location.origin);

// Wsem creation
wsem = new WsEventMgr(socket);

// We want to receive 'time' events
wsem.on('time', function (time) {
  document.getElementById('timeValueContainer').innerText = time;
});

// When a new 'todo' is received, we update the page
function addTodo(todo) {
  var todoList = document.getElementById('todoList')
    , item;
  item = document.createElement('li');
  item.innerText = todo;
  todoList.appendChild(item);
}

// Check toggle to start/stop listening for 'todo' event
function checkListenMode() {
  if (document.getElementById('listenToggle').checked) {
    wsem.on('todo', addTodo);
  } else {
    wsem.end('todo', addTodo);
  }
}

// First time check
checkListenMode();
document.getElementById('listenToggle').onchange = checkListenMode;

// When a new todo is submitted, we send it to the server
document.getElementById('newTodoForm').onsubmit = function () {
  var todoField = document.getElementById('newTodoField');
  wsem.emit('todo', todoField.value);
  todoField.value = '';
  return false;
};