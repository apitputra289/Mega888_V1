// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8888;

app.use(cors());
app.use(express.json());

let users = {
  'user123': { password: 'abc123', credit: 1000 },
  'admin': { password: 'admin123', credit: 0, isAdmin: true }
};

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt: ${username}`);
  const user = users[username];

  if (user && user.password === password) {
    console.log(`Login success for ${username}`);
    return res.json({ success: true, username, credit: user.credit, isAdmin: user.isAdmin || false });
  }
  console.log(`Login failed for ${username}`);
  return res.status(401).json({ success: false, message: 'Login gagal' });
});

app.post('/api/topup', (req, res) => {
  const { adminUsername, username, amount } = req.body;
  console.log(`Topup request by ${adminUsername} for ${username} amount ${amount}`);
  const admin = users[adminUsername];

  if (!admin || !admin.isAdmin) {
    console.log('Topup denied: Invalid admin');
    return res.status(403).json({ success: false, message: 'Bukan admin' });
  }

  if (!users[username]) {
    console.log('Topup failed: User not found');
    return res.status(404).json({ success: false, message: 'User tidak dijumpai' });
  }

  users[username].credit += amount;
  console.log(`Topup successful: ${username} new credit ${users[username].credit}`);
  return res.json({ success: true, newCredit: users[username].credit });
});

app.post('/api/adduser', (req, res) => {
  const { adminUsername, newUsername, newPassword } = req.body;
  console.log(`Add user request by ${adminUsername} for ${newUsername}`);
  const admin = users[adminUsername];

  if (!admin || !admin.isAdmin) {
    console.log('Add user denied: Invalid admin');
    return res.status(403).json({ success: false, message: 'Bukan admin' });
  }

  if (users[newUsername]) {
    console.log('Add user failed: User already exists');
    return res.status(409).json({ success: false, message: 'User sudah wujud' });
  }

  users[newUsername] = { password: newPassword, credit: 0 };
  console.log(`User added successfully: ${newUsername}`);
  return res.json({ success: true });
});

app.get('/api/users/:adminUsername', (req, res) => {
  const adminUsername = req.params.adminUsername;
  console.log(`User list requested by ${adminUsername}`);
  const admin = users[adminUsername];

  if (!admin || !admin.isAdmin) {
    console.log('User list denied: Invalid admin');
    return res.status(403).json({ success: false, message: 'Bukan admin' });
  }

  console.log('User list sent');
  return res.json(users);
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Mega888 Admin Panel</title>
      </head>
      <body style="font-family:sans-serif;padding:20px">
        <h2>Admin Login</h2>
        <form onsubmit="login(event)">
          <input placeholder="Username" id="username" /><br/>
          <input placeholder="Password" id="password" type="password" /><br/>
          <button type="submit">Login</button>
        </form>

        <div id="adminUI" style="display:none">
          <h3>Welcome, Admin</h3>
          <button onclick="loadUsers()">Lihat Semua Pengguna</button>
          <div id="userList"></div>
        </div>

        <script>
          async function login(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const res = await fetch('/api/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (data.success && data.isAdmin) {
              document.getElementById('adminUI').style.display = 'block';
            } else {
              alert('Login gagal atau bukan admin');
            }
          }

          async function loadUsers() {
            const adminUsername = document.getElementById('username').value;
            const res = await fetch('/api/users/' + adminUsername);
            const data = await res.json();

            const html = Object.entries(data).map(([user, val]) => 
              `<div><b>${user}</b> - Kredit: ${val.credit}</div>`).join('');
            document.getElementById('userList').innerHTML = html;
          }
        </script>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Fake Mega888 Backend running on http://localhost:${PORT}`);
});
