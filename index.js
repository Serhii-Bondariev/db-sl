const createError = require("http-errors");
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const app = express();
const multer = require("multer");
const moment = require("moment");
const uploadDir = path.join(process.cwd(), "uploads");
const storeImage = path.join(process.cwd(), "images");
require("colors");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const date = moment().format("DD-MM-YYYY_HH-mm-ss");
    cb(null, `${date}-${file.originalname}`);
  },
});

const filelimits = {
  fileSize: 1024 * 1024 * 5,
};

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/webp") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  filelimits,
});

app.post("/upload", upload.single("picture"), async (req, res, next) => {
  const { description } = req.body;
  const { path: temporaryName, originalname } = req.file;
  const fileName = path.join(storeImage, originalname);
  try {
    await fs.rename(temporaryName, fileName);
  } catch (err) {
    await fs.unlink(temporaryName);
    return next(err);
  }
  res.json({
    description,
    message: "Файл успішно завантажено",
    status: 200,
  });
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({ message: err.message, status: err.status });
});

const isAccessible = (path) => {
  return fs
    .access(path)
    .then(() => true)
    .catch(() => false);
};

const createFolderIsNotExist = async (folder) => {
  if (!(await isAccessible(folder))) {
    await fs.mkdir(folder);
  }
};

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  createFolderIsNotExist(uploadDir);
  createFolderIsNotExist(storeImage);
  console.log(`Server running. Use on port:${PORT}`.bgCyan);
});
