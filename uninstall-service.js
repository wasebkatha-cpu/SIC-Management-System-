import { Service } from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new service object
const svc = new Service({
  name: 'SIC Management System',
  description: 'Runs the SIC Management System backend and serves the frontend.',
  script: path.join(__dirname, 'server', 'index.js')
});

// Listen for the "uninstall" event
svc.on('uninstall', function() {
  console.log('Uninstall complete.');
  console.log('The service exists: ', svc.exists);
});

// Uninstall the service.
svc.uninstall();
