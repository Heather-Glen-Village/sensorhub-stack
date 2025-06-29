import http from 'http';
import { exec } from 'child_process';

const SECRET = 'supersecret';

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';

    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);

        // Optional secret validation
        if (payload.secret && payload.secret !== SECRET) {
          res.writeHead(403);
          return res.end('Forbidden');
        }

        const commands = `
          docker stop $(docker ps -aq) || true &&
          docker rm -f next-auth-app || true &&

          cd /home/station3/Desktop/sensorhub-stack &&
          git fetch origin &&
          git reset --hard origin/main &&

          cd server_compose &&
          docker compose up -d --build &&

          cd ../client_interface &&
          docker compose up -d --build
        `;

        exec(commands, (err, stdout, stderr) => {
          if (err) {
            console.error('❌ Error:', stderr);
            res.writeHead(500);
            return res.end('Deploy failed');
          }

          console.log('✅ Deploy log:', stdout);
          res.writeHead(200);
          res.end('Deployed successfully');
        });

      } catch (err) {
        res.writeHead(400);
        res.end('Bad Request');
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8085, () => {
  console.log('🚀 Webhook listener running on port 8085');
});
