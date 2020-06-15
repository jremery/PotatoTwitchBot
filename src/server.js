const express = require('express');
const path = require('path');

const app = express();

app.get('/', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(8081, () => {
  console.info('Running on port 8081');
});

console.log('Server is running at http://localhost:8081');

app.use('/api/twitch', require('./twitch').router);

app.use((err, req, res, next) => {
    switch (err.message) {
      case 'NoCodeProvided':
        return res.status(400).send({
          status: 'ERROR',
          error: err.message,
        });
      default:
        return res.status(500).send({
          status: 'ERROR',
          error: err.message,
        });
    }
  });