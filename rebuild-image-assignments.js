// Script to rebuild image-assignments.json from the images/ directory
const fs = require('fs');
const path = require('path');

const imagesDir = './images';
const outputFile = './image-assignments.json';

function createImageAssignments() {
    console.log('🔄 Rebuilding image-assignments.json...');
    
    if (!fs.existsSync(imagesDir)) {
        console.error('❌ Images directory not found:', imagesDir);
        return;
    }

    const assignments = {};
    const imageFiles = fs.readdirSync(imagesDir);
    
    console.log(`📁 Found ${imageFiles.length} files in images directory`);
    
    let processed = 0;
    
    for (const filename of imageFiles) {
        // Skip non-image files
        if (!filename.match(/\.(webp|jpg|jpeg|png|gif)$/i)) {
            console.log(`⚠️  Skipping non-image file: ${filename}`);
            continue;
        }
        
        try {
            const filePath = path.join(imagesDir, filename);
            const imageBuffer = fs.readFileSync(filePath);
            const base64Data = imageBuffer.toString('base64');
            
            // Determine MIME type
            let mimeType = 'image/webp';
            if (filename.match(/\.jpe?g$/i)) mimeType = 'image/jpeg';
            else if (filename.match(/\.png$/i)) mimeType = 'image/png';
            else if (filename.match(/\.gif$/i)) mimeType = 'image/gif';
            
            // Create data URL
            const dataUrl = `data:${mimeType};base64,${base64Data}`;
            
            // Use filename without extension as key
            const key = filename.replace(/\.[^.]+$/, '');
            
            assignments[key] = {
                src: dataUrl,
                filename: filename
            };
            
            processed++;
            
            if (processed % 50 === 0) {
                console.log(`✅ Processed ${processed} images...`);
            }
            
        } catch (error) {
            console.error(`❌ Error processing ${filename}:`, error.message);
        }
    }
    
    console.log(`✅ Processed ${processed} images total`);
    
    // Write the JSON file
    try {
        const jsonString = JSON.stringify(assignments, null, 2);
        fs.writeFileSync(outputFile, jsonString);
        console.log(`🎉 Successfully created ${outputFile}`);
        console.log(`📊 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📝 Contains ${Object.keys(assignments).length} image assignments`);
    } catch (error) {
        console.error('❌ Error writing JSON file:', error.message);
    }
}

// Run the script
createImageAssignments();