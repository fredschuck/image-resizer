const form = document.querySelector("#img-form");
const img = document.querySelector("#img");
const outputPath = document.querySelector("#output-path");
const filename = document.querySelector("#filename");
const heightInput = document.querySelector("#height");
const widthInput = document.querySelector("#width");

function loadImage(e) {
  const file = e.target.files[0];

  if (!isFileImage(file)) {
    alertError("Please select an image");
    return;
  }

  // Get original image dimensions
  const image = new Image();
  image.src = URL.createObjectURL(file);
  image.onload = function () {
    heightInput.value = this.height;
    widthInput.value = this.width;
  };

  form.style.display = "block";
  filename.innerText = file.name;
  outputPath.innerText = path.join(os.homedir(), "imageresizer");
}

function sendImage(e) {
  e.preventDefault();
  const height = parseInt(heightInput.value);
  const width = parseInt(widthInput.value);
  const imgPath = img.files[0].path;

  if (!img.files[0]) {
    alertError("Please select an image");
    return;
  }

  if (!height || height <= 0 || !width || width <= 0) {
    alertError("Please enter valid dimensions");
    return;
  }

  // Send to main using ipcRenderer
  ipcRenderer.send("image:resize", {
    imgPath,
    height,
    width,
  });
}

// Catch the image:done event
ipcRenderer.on("image:done", () => {
  alertSuccess(`Image resized to ${widthInput.value} x ${heightInput.value}`);
  //   form.reset();
  //   form.style.display = "none";
});

// Make sure file is image
function isFileImage(file) {
  const acceptedImageTypes = ["image/gif", "image/jpeg", "image/png"];
  return file && acceptedImageTypes.includes(file["type"]);
}

function alertError(message) {
  Toastify.toast({
    text: message,
    duration: 3000,
    close: false,
    gravity: "top",
    position: "center",
    style: {
      background: "red",
      color: "#fff",
      textAlign: "center",
    },
  });
}

function alertSuccess(message) {
  Toastify.toast({
    text: message,
    duration: 3000,
    close: false,
    gravity: "top",
    position: "center",
    style: {
      background: "green",
      color: "#fff",
      textAlign: "center",
    },
  });
}

img.addEventListener("change", loadImage);
form.addEventListener("submit", sendImage);
