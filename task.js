const fs = require("fs");
// const path = require("path");
// const { INTEGER } = require("sequelize");

// const taskFilePath = path.join(process.cwd(), "task.txt");
const taskFilePath = `${__dirname}/task.txt`
// const completedFilePath = path.join(process.cwd(), "completed.txt");
const completedFilePath = `${__dirname}/completed.txt`


function getFileData(callback) {
  fs.readFile(taskFilePath, "utf8", (error, data) => {
    if (error) {
      console.log(error)
      callback([]);
    } else {
      const content = data.split("\n").filter(Boolean);
      callback(content);
    }
  });
}
  const addTask = (priority, ...args) => {
    const priorityRegex = /^\d+$/;
    const dateComponents = args[1].split("-"); // Assuming the date format is "DD-MM-YYYY"
    const dueDate = new Date(dateComponents[2], dateComponents[1] - 1, dateComponents[0]); // Month is 0-indexed
    const currentDate = new Date();
  
    if (!priorityRegex.test(priority)) {
      console.log("Error: Priority should be a non-negative integer. Nothing added!");
      return;
    }
  
    if (dueDate.getTime() < currentDate.getTime()) {
      console.log("Error: Due date should not be in the past.");
      return;
    }
  
    const task = args.length === 2 && args[0].startsWith('"') && args[0].endsWith('"')
      ? args[0].slice(1, -1)
      : args.slice(0, 2).join(' ');
  
    getFileData((tasks) => {
      // Check if the priority already exists in the tasks array using a for loop
      let hasDuplicatePriority = false;
      for (const line of tasks) {
        const existingPriority = parseInt(line.split(" ")[0]);
        if (existingPriority === priority) {
          hasDuplicatePriority = true;
          break;
        }
      }
  
      if (hasDuplicatePriority) {
        console.log(`Error: Task with priority ${priority} already exists. Nothing added!`);
        return;
      }
  
      let insertIndex = tasks.findIndex((line) => parseInt(line.split(" ")[0]) > priority);
      if (insertIndex === -1) {
        insertIndex = tasks.length;
      }
  
      const taskLine = `${priority} ${task}`; // Adding the due date to the task line
      tasks.splice(insertIndex, 0, taskLine);
      fs.writeFileSync(taskFilePath, tasks.join("\n"));
  
      console.log(`Added task: "${task}" with priority ${priority} and due date ${args[1]}`);
    });
  };
  

const editTask = (index, ...args) => {
  getFileData((tasks) => {
    if (index <= 0 || index > tasks.length) {
      console.log(`Error: task with index #${index} does not exist. Nothing edited.`);
      return;
    }

    const newTaskDescription = args.join(' ');
    tasks[index - 1] = `${tasks[index - 1].split(" ")[0]} ${newTaskDescription}`;
    fs.writeFileSync(taskFilePath, tasks.join("\n"));

    console.log(`Edited task #${index}`);
  });
};


const editPriority =(index,newpri)=>{
  getFileData((tasks) => {
    if (index <= 0 || index > tasks.length) {
      console.log(`Error: task with index #${index} does not exist. Nothing deleted.`);
      return;
    }
    const priorityRegex = /^\d+$/;
    if (!priorityRegex.test(newpri)) {
      console.log("Error: Priority should be a non-negative integer. Priority not changed!");
      return;
    }
    tasks[index-1]=`${newpri} ${tasks[index-1].split(" ").slice(1).join(" ")}`
    fs.writeFileSync(taskFilePath, tasks.join("\n"));
})
}



const deleteTask = (index) => {
  if (index === "all"){
    fs.writeFileSync(taskFilePath,"");
    return
  }
  getFileData((tasks) => {
    if (index <= 0 || index > tasks.length) {
      console.log(`Error: task with index #${index} does not exist. Nothing deleted.`);
      return;
    }

    tasks.splice(index - 1, 1);
    fs.writeFileSync(taskFilePath, tasks.join("\n"));

    console.log(`Deleted task #${index}`);
  });
};

const markAsComplete = (index) => {
  getFileData((tasks) => {
    if (index <= 0 || index > tasks.length) {
      console.log(`Error: no incomplete item with index #${index} exists.`);
      return;
    }

    const task = tasks[index - 1];
    tasks.splice(index - 1, 1);

    fs.writeFileSync(taskFilePath, tasks.join("\n"));
    fs.appendFileSync(completedFilePath, `${task.slice(task.indexOf(" ") + 1)}\n`);

    console.log(`Marked item as done.`);
  });
};

const allTasks = () => {
  getFileData((tasks) => {
    if (tasks.length === 0) {
      console.log("There are no pending tasks!");
    } else {
      tasks.sort((a, b) => {
        const priorityA = parseInt(a.split(" ")[0]);
        const priorityB = parseInt(b.split(" ")[0]);
        if (priorityA === priorityB) {
          // If priorities are equal, sort by their original order
          const indexA = tasks.indexOf(a);
          const indexB = tasks.indexOf(b);
          return indexA - indexB;
        }
        return priorityA - priorityB;
      });

      tasks.forEach((task, index) => {
        const [priority, description] = task.split(" ");
        console.log(`${index + 1}. ${task.slice(task.indexOf(" ") + 1)} [${priority}]`);
      });
    }
  });
};

const Statistics = () => {
  getFileData((tasks) => {
    const completedTasks = fs.readFileSync(completedFilePath, "utf8").split("\n").filter(Boolean);

    console.log(`Pending : ${tasks.length}`);
    tasks.forEach((task, index) => {
      const [priority, description] = task.split(" ");
      console.log(`${index + 1}. ${task.slice(task.indexOf(" ") + 1)} [${priority}]`);
    });

    console.log(`\nCompleted : ${completedTasks.length}`);
    completedTasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task}`);
    });
  });
};

const showUsage = () => {
  console.log("Usage :-");
  console.log('$ ./task add 2 hello world    # Add a new item with priority 2 and text "hello world" to the list');
  console.log("$ ./task ls                   # Show incomplete priority list items sorted by priority in ascending order");
  console.log("$ ./task del INDEX            # Delete the incomplete item with the given index");
  console.log("$ ./task done INDEX           # Mark the incomplete item with the given index as complete");
  console.log("$ ./task help                 # Show usage");
  console.log("$ ./task report               # Statistics");
};

const Commands = (command, ...args) => {
  switch (command) {
    case "add":
      if (args.length !== 3) {
        console.log("Error: Missing tasks string. Nothing added!");
        break;
      }
      addTask(args[0], args[1],args[2]);
      break;
    case "del":
      if (args.length !== 1) {
        console.log("Error: Missing NUMBER for deleting tasks.");
        break;
      }
      deleteTask(args[0]);
      break;
    case "done":
      if (args.length !== 1) {
        console.log("Error: Missing NUMBER for marking tasks as done.");
        break;
      }
      markAsComplete(parseInt(args[0]));
      break;
    case "ls":
      allTasks();
      break;
    case "report":
      Statistics();
      break;
    case "help":
      showUsage();
      break;
    case "editdes":
      if (args.length < 2) {
        console.log("Error: Missing INDEX or NEW_TASK for editing task.");
        break;
      }
      editTask(parseInt(args[0]), ...args.slice(1));
      break;
    case "editpri":
      editPriority(parseInt(args[0]),parseInt(args[1]));
      break;
    default:
      showUsage();
  }
};

const [command, ...args] = process.argv.slice(2);
Commands(command, ...args);
