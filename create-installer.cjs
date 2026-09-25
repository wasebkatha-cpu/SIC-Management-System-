const electronInstaller = require('electron-winstaller');
const path = require('path');

async function createInstaller() {
  console.log('Building installer, please wait...');
  try {
    await electronInstaller.createWindowsInstaller({
      appDirectory: path.join(__dirname, 'dist-final', 'SIC Management System-win32-x64'),
      outputDirectory: path.join(__dirname, 'installer'),
      authors: 'SIC',
      exe: 'SIC Management System.exe',
      setupExe: 'SIC Management System Setup.exe',
      description: 'SIC Management System Desktop Application',
      setupIcon: path.join(__dirname, 'icon.ico'),
      noMsi: true,
    });
    console.log('Installer built successfully!');
    console.log('You can find the setup file at: ' + path.join(__dirname, 'installer', 'SIC Management System Setup.exe'));
  } catch (e) {
    console.error('No dice: ' + e.message);
  }
}

createInstaller();
