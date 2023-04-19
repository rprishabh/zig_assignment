const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

app.post('/upload', upload.single('video'), (req, res) => {
  res.send('Video uploaded successfully!');
});

app.get('/stream/:video', (req, res) => {
  const videoPath = path.join(__dirname, 'uploads', req.params.video);
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const headers = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, headers);
    file.pipe(res);
  } else {
    const headers = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, headers);
    fs.createReadStream(videoPath).pipe(res);
  }
});

app.get('/download/:video', (req, res) => {
  const videoPath = path.join(__dirname, 'uploads', req.params.video);
  res.download(videoPath, (err) => {
    if (err) {
      console.error(err);
      res.sendStatus(404);
    }
  });
});

app.listen(3000, () => console.log('Server is listening on port 3000'));
