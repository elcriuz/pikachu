const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || './data';

function deleteThumbnails(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      deleteThumbnails(fullPath);
    } else if (file.endsWith('_thumb.jpg')) {
      console.log('Deleting thumbnail:', fullPath);
      fs.unlinkSync(fullPath);
    }
  });
}

console.log('Clearing all thumbnails from:', DATA_DIR);
deleteThumbnails(DATA_DIR);
console.log('Done!');