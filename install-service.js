import { Service } from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new service object
const svc = new Service({
  name: 'SIC Management System',
  description: 'Runs the SIC Management System backend and serves the frontend.',
  script: path.join(__dirname, 'server', 'index.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
  svc.start();
  console.log('Service installed and started successfully!');
  console.log('The application will now run automatically in the background.');
});

// Listen for the "alreadyinstalled" event
svc.on('alreadyinstalled', function() {
  console.log('This service is already installed.');
});

// Listen for the "start" event
svc.on('start', function() {
  console.log('Service started.');
});

svc.install();
