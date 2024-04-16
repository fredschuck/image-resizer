const path = require("path");
const os = require("os");
const fs = require("fs");
const resizeImg = require("resize-img");
const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");

process.env.NODE_ENV = "production";

const isDev = process.env.NODE_ENV !== "production";
const isMac = process.platform === "darwin";
let mainWindow;

//Create main window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "PhotoFit",
    width: isDev ? 1000 : 500,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Open devtools if in dev env
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
}

// Create about window
function createAboutWindow() {
  const aboutWindow = new BrowserWindow({
    title: "PhotoFit - About",
    width: 300,
    height: 300,
  });

  aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
}

// Listen for app to be ready
app.whenReady().then(() => {
  createMainWindow();

  // Implement menu
  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // Remove main window on close
  mainWindow.on("closed", () => (mainWindow = null));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Menu Template
const menu = [
  ...(isMac
    ? [
        {
          label: app.name,
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
  {
    role: "fileMenu",
  },
  ...(!isMac
    ? [
        {
          label: "help",
          submenu: [
            {
              label: "About",
              click: createAboutWindow,
            },
          ],
        },
      ]
    : []),
];

// Respond to ipcRenderer resize
ipcMain.on("image:resize", (e, options) => {
  options.dest = path.join(os.homedir(), "imageresizer"); // Maybe problem here with "imageResizer" instead of "imageresizer"
  resizeImage(options);
});

// Resize image
async function resizeImage({ imgPath, width, height, dest }) {
  try {
    const newPath = await resizeImg(fs.readFileSync(imgPath), {
      width: +width,
      height: +height,
    });
    // Get the filename
    const filename = path.basename(imgPath);
    // Create destination folder if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    // Write the new image to the destination
    fs.writeFileSync(path.join(dest, filename), newPath);
    // Send a success message
    mainWindow.webContents.send("image:done");
    // Open the destination folder
    shell.openPath(dest);
  } catch (error) {
    // alertError("Something went wrong");
    console.log(error);
  }
}

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});
