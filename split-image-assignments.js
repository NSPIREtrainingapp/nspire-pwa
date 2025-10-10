const fs = require('fs');
const path = require('path');

console.log('🔄 Splitting large image-assignments.json into smaller chunks...');

// Read the large JSON file
const largeFile = JSON.parse(fs.readFileSync('image-assignments.json', 'utf8'));
const entries = Object.entries(largeFile);
const totalImages = entries.length;

console.log(`📊 Total images: ${totalImages}`);

// Split into chunks of 50 images each (~2.5MB per chunk)
const imagesPerChunk = 50;
const totalChunks = Math.ceil(totalImages / imagesPerChunk);

console.log(`📦 Creating ${totalChunks} chunks of ${imagesPerChunk} images each`);

// Create chunks directory
if (!fs.existsSync('image-chunks')) {
    fs.mkdirSync('image-chunks');
}

// Split into chunks
for (let i = 0; i < totalChunks; i++) {
    const startIndex = i * imagesPerChunk;
    const endIndex = Math.min(startIndex + imagesPerChunk, totalImages);
    const chunkEntries = entries.slice(startIndex, endIndex);
    
    const chunkData = {};
    chunkEntries.forEach(([key, value]) => {
        chunkData[key] = value;
    });
    
    const chunkFileName = `image-chunks/chunk-${i + 1}.json`;
    fs.writeFileSync(chunkFileName, JSON.stringify(chunkData));
    
    const chunkFileSize = fs.statSync(chunkFileName).size;
    console.log(`✅ Created ${chunkFileName} with ${chunkEntries.length} images (${Math.round(chunkFileSize / 1024 / 1024 * 10) / 10}MB)`);
}

// Create index file that lists all chunks
const indexData = {
    totalImages,
    totalChunks,
    imagesPerChunk,
    chunks: Array.from({ length: totalChunks }, (_, i) => `chunk-${i + 1}.json`)
};

fs.writeFileSync('image-chunks/index.json', JSON.stringify(indexData, null, 2));
console.log('✅ Created image-chunks/index.json');

console.log(`
🎉 Split complete!
- Original file: 33MB with ${totalImages} images
- Created: ${totalChunks} chunks of ~2.5MB each
- Chunks stored in: image-chunks/ directory
- Index file: image-chunks/index.json

Next steps:
1. Copy the image-chunks folder to your web server
2. Update the image loading code to use chunked loading
`);