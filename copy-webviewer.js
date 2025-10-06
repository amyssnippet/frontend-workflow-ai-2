const fs = require('fs-extra');
const path = require('path');

const source = path.join(__dirname, 'node_modules', '@pdftron', 'webviewer', 'public');
const destination = path.join(__dirname, 'public', 'lib', 'webviewer');

async function copyFiles() {
  try {
    // Check if source exists
    if (!fs.existsSync(source)) {
      console.error('❌ WebViewer source files not found!');
      console.error('Run: npm install @pdftron/webviewer');
      process.exit(1);
    }

    // Create destination directory
    await fs.ensureDir(destination);

    // Copy files
    console.log('📦 Copying WebViewer static files...');
    await fs.copy(source, destination, { overwrite: true });
    console.log('✅ WebViewer static files copied successfully!');
  } catch (error) {
    console.error('❌ Error copying WebViewer files:', error);
    process.exit(1);
  }
}

copyFiles();
